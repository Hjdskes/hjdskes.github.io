+++
date = 2022-09-02T17:12:18+02:00
title = "Streaming a file from S3 to SFTP on AWS Lambda using Haskell"
description = "A case study of composition"
tags = ["aws","haskell"]
categories = ["Projects"]
+++

At work we embrace the serverless computing model and (typed) functional programming. My team's Haskell service is therefore built upon, amongst others, AWS S3 and AWS Lambda. Earlier I wrote about [how we deploy our Haskell binaries on AWS Lambda](https://www.hjdskes.nl/blog/haskell-nix-aws-lambda/). Today I will write about something at a somewhat higher level. Let's dig in!

The functional programming style encourages you to break down your problem into smaller problems. Smaller problems are easier to comprehend and reason about, and by decomposing your problem this way you often end up with a more general solution. These more general solutions to smaller problems allow themselves to be composed into solutions to bigger problems that come with certain business needs. Just this week at work I was tasked with something where this compositionality showed itself so nicely that I felt inspired to write about it!

Without going into too many details, my team was faced with the task to upload a file to a third party SFTP server. These files can be in the hundreds of megabytes; while not large, they are not exactly small either. Simply downloading the files to the Lambda's ephemeral filesystem and then uploading them to the SFTP server is not only inelegant and inefficient, it is also impractical. For one, we risk hitting the Lambda's execution time limit: [AWS Lambda functions can only be configured to run up to 15 minutes per execution](https://aws.amazon.com/lambda/faqs/#:~:text=Q%3A%20How%20long%20can%20an,1%20second%20and%2015%20minutes.). Secondly, downloading a file first only to start uploading it after you are done downloading it is slow.

Let's see if we can apply a high level decomposition to our problem: first we need to download a file from S3, and then we need to upload it to an SFTP server. Downloading from S3 is easy: we just use the great [Amazonka](https://hackage.haskell.org/package/amazonka) library to perform an `s3:GetObject` call. But now what? Fortunately we have Ilya V. Portnov's [libssh2-hs](https://hackage.haskell.org/package/libssh2) Haskell wrapper around [libssh2](http://libssh2.org/), one of the de facto standard SSH libraries. libssh2-hs provides a function to write a local file to a remote SFTP server, but we don't want to have to download the file to the Lambda's filesystem first. Can we perhaps stream the file from S3 to SFTP?

If you've read the title of this post, you already know the answer. Bear with me. First, we need to see if we can stream the file from S3. The response we get from sending a [`GetObject`](https://hackage.haskell.org/package/amazonka-s3-1.6.1/docs/Network-AWS-S3-GetObject.html#t:GetObject) value with Amazonka, is a [`GetObjectResponse`](https://hackage.haskell.org/package/amazonka-s3-1.6.1/docs/Network-AWS-S3-GetObject.html#t:GetObjectResponse). This response contains many fields (just look at the [source](https://hackage.haskell.org/package/amazonka-s3-1.6.1/docs/src/Network.AWS.S3.GetObject.html#GetObjectResponse)), but the one we are interested in is the body: the file contents! We can extract it using the [`gorsBody`](https://hackage.haskell.org/package/amazonka-s3-1.6.1/docs/Network-AWS-S3-GetObject.html#v:gorsBody) lens. Doing so gives us a value of type [`RsBody`](https://hackage.haskell.org/package/amazonka-core-1.6.1/docs/Network-AWS-Data-Body.html#t:RsBody). Reading its documentation, we see that an `RsBody` is "a streaming, exception safe response body." Indeed, we see that it is really just a wrapper around a ([Conduit](https://hackage.haskell.org/package/conduit)) stream producing Haskell `ByteString`s! Putting this all together, we get a stream producing the file contents like so:

```haskell
getStreamFromS3 :: forall m n
  .  MonadAWS m
  => MonadIO n
  => BucketName -> ObjectKey -> m (ConduitT () ByteString (ResourceT n) ())
getStreamFromS3 bucketName objectKey = send request >>= processResponse
  where
    request = getObject bucketName objectKey
    processResponse response = response ^. gorsBody . to (pure . _streamBody)
```

Neat! We can stream the file's bytes from S3. How do we stream those bytes to the SFTP server? Circling back to the topic of compositionality, if we can create another stream that _consumes_ `ByteString`s and writes those to the SFTP server, we can _compose_ the two streams; et voilà, we are done! How would a function creating such a stream look like? Well, it would be the composition of some pure function to write bytes to an SFTP server and some functions to apply that function in a stream:

```haskell
streamToSftp :: forall a m
  .  Monoid a
  => MonadIO m
  => SftpHandle -> ConduitT ByteString Void (ResourceT m) a
streamToSftp sftpHandle = loop
  where
    loop = await >>= \case
      Nothing -> pure mempty
      Just bytes -> liftIO (sftpWriteFileFromBytes sftpHandle bytes) >> loop
```

That is, we create a loop that blocks until it can consume a new `ByteString`. If there is such a value (`await` returns `Just ByteString`) we apply it to `sftpWriteFileFromBytes` and loop. If there is no new `ByteString` (`await` returns `Nothing`), we break the loop and return a default value. (Notice how I said in the beginning of this post how decomposing problems makes your solutions more general? Using `Monoid a` and `mempty` is an example of that!).

Now, this would work... if only there was an `sftpWriteFileFromBytes` function! As I said, libssh2-hs only had functionality to write files. I rolled up my sleeves and got to work on a function that writes an arbitrary `ByteString` to a remote file on an SFTP server. This was a fun exercise due to the FFI and the low abstraction level of the code: we are dealing with the underlying bytes of a Haskell `ByteString` and have the potential to break the pure world we love to imagine. If we look at the basi.. I mean, if we decompose (😉) the problem, the smallest unit we have to work with is libssh2's [`libssh2_sftp_write`](https://www.libssh2.org/libssh2_sftp_write.html) function. This function takes a pointer to an array of characters and a counter of how many elements to write to the remote file handle. Hence, we need to get access to the `ByteString`'s underlying buffer and its length. A `ByteString` is a Haskell wrapper around a pointer to an array of bytes and a length. But how do we get access to this pointer and this length? `ByteString` is an opaque type!

Thankfully, there are escape hatches for situations like these. We can use [`useAsCStringLen`](https://hackage.haskell.org/package/bytestring-0.11.2.0/docs/Data-ByteString.html#v:useAsCStringLen) to get a copy of the original byte array and its length. That is good, because operating on a copy means we cannot accidentally change the `ByteString` behind Haskell's back and break referential transparency. Now that we have access to the raw bytes, all we need to do is invoke `libssh2_sftp_write` and do some bookkeeping! I'll let the code below speak for itself.

```haskell
sftpWriteFileFromBytes :: SftpHandle -> ByteString -> IO Integer
sftpWriteFileFromBytes sftpHandle bytes = useAsCStringLen bytes (uncurry (send 0))
  where
    send :: Int -> Ptr CChar -> Int -> Integer
    send written _ 0 = pure (toInteger written)
    send written src len = do
      -- Since we are recursively incrementing `src`, we need to be careful that we can still read `bufferSize` bytes from
      -- our original bytestring. We track this by recursively subtracting the number of bytes sent from `len`. At some
      -- point the number of bytes left will be smaller than `bufferSize`. This check here captures that edge case.
      let nBytes = min len bufferSize
      -- Write the data to the SFTP server. We can just pass `src` because we increment its pointer in every recursive call.
      -- Note that `libssh2_sftp_write` does not guarantee to send exactly the number of bytes we tell it to; hence we keep
      -- track of the number of bytes it did actually send in `sent`.
      sent <- fmap fromIntegral . handleInt (Just sftpHandle) $
        {# call libssh2_sftp_write #} (toPointer sftpHandle) src (fromIntegral nBytes)
      -- Finally, we make the recursive call where we make sure to do the incrementing and decrementing described above.
      send (written + sent) (src `plusPtr` sent) (len - sent)
```

This is merged into libssh2-hs ([PR #1](https://github.com/portnov/libssh2-hs/pull/64) with correction [PR #2](https://github.com/portnov/libssh2-hs/pull/65), and [one other fix](https://github.com/portnov/libssh2-hs/pull/63)).

Now we almost have all the pieces in place to stream a file from S3 to an SFTP server. We just need to compose and run the two streams:

```haskell
streamFromS3ToSftp :: forall m
  .  MonadAWS m
  => MonadUnliftIO m
  => MonadReader Sftp m
  => BucketName -> ObjectKey -> m ()
streamFromS3ToSftp bucketName objectKey = do
  streamFromS3 <- getStreamFromS3 bucketName objectKey
  sftp <- ask
  withSftpHandle sftp fileName $ \sftpHandle ->
    runConduitRes (streamFromS3 .| streamToSftp sftpHandle)
  where
    fileName = objectKey ^. keyName '/' . to unpack
```

Remember how I said the only thing we're missing was an `sftpWriteFileFromBytes` function? I lied, a little bit. Trying to compile this code will get you a compilation error:

```
src/Streaming.hs:36:3: error:
    • Couldn't match type ‘m’ with ‘IO’
      ‘m’ is a rigid type variable bound by
        the type signature for:
          streamFromS3ToSftp :: forall (m :: * -> *).
                                (MonadAWS m, MonadReader Sftp m, MonadIO m) =>
                                BucketName -> ObjectKey -> m ()
        at src/Streaming.hs:32:1-112
      Expected type: m ()
        Actual type: IO ()
```

We have a mismatch in our types: `RsBody` contains a `ConduitM () ByteString (ResourceT IO) ()`, but `streamToSftp` returns a `ConduitT ByteString Void (ResourceT m) a`. Note the `ResourceT IO` versus `ResourceT m` part. Thankfully, Conduit allows us to [transform the monad that a stream lives in](https://hackage.haskell.org/package/conduit-1.3.4.2/docs/Data-Conduit.html#v:transPipe), and `ResourceT` comes with a function to [transform the monad that the `ResourceT` lives in](https://hackage.haskell.org/package/resourcet-1.2.4.3/docs/Control-Monad-Trans-Resource.html#v:transResourceT)! Two compositions later, and we end up
with something that can transform the monad in the `ResourceT` in the `ConduitT`:

```haskell
_streamBodyM :: MonadIO m => RsBody -> ConduitT () ByteString (ResourceT m) ()
_streamBodyM (RsBody body) = transPipe (transResourceT liftIO) body
```

I named it `_streamBodyM` because it lifts `RsBody`'s `_streamBody`. There are some [intricate implementation details](https://github.com/snoyberg/conduit/wiki/Dealing-with-monad-transformers) of `transPipe` that I will leave as an exercise to the reader. Now we replace our usage of `_streamBody` with `_streamBodyM` in `getStreamFromS3` and we are good to go!

Don't fret if you don't understand all the details. What I hope to convey to you is the fact that functional programing can be like playing with Lego! In my case, all the Lego blocks I needed are there, some bigger ones and some smaller ones. Due to the compositionality of (purely) functional code, all we have to do is identify the Lego blocks, find them, and compose them! I went from zero to a functioning serverless, streaming SFTP client in less than a week. How cool is that?!

Full code:
<spoiler>

```haskell
module Streaming where

import Conduit (ConduitT, ResourceT, await, runConduitRes, transPipe, (.|))
import Control.Monad.IO.Class (MonadIO (..))
import Control.Monad.Reader (MonadReader (..))
import Control.Monad.Trans.Resource (MonadUnliftIO, transResourceT)
import Data.ByteString (ByteString)
import Data.Text (unpack)
import Data.Void (Void)
import Network.AWS (MonadAWS, send)
import Network.AWS.Data.Body (RsBody (..))
import Network.AWS.Lens ((^.), to)
import Network.AWS.S3 (BucketName, ObjectKey, keyName)
import Network.AWS.S3.GetObject (getObject, gorsBody)
import Network.SSH.Client.LibSSH2 (Sftp, SftpHandle)
import Network.SSH.Client.LibSSH2.Foreign (SftpFileTransferFlags (..), sftpCloseHandle, sftpOpenFile)
import Network.SSH.Client.LibSSH2.Foreign (sftpWriteFileFromBytes)
import UnliftIO (bracket)

getStreamFromS3 :: forall m n
  .  MonadAWS m
  => MonadIO n
  => BucketName -> ObjectKey -> m (ConduitT () ByteString (ResourceT n) ())
getStreamFromS3 bucketName objectKey = send request >>= processResponse
  where
    request = getObject bucketName objectKey
    processResponse response = response ^. gorsBody . to (pure . _streamBodyM)

streamToSftp :: forall a m
  .  Monoid a
  => MonadIO m
  => SftpHandle -> ConduitT ByteString Void (ResourceT m) a
streamToSftp sftpHandle = loop
  where
    loop = await >>= \case
      Nothing -> pure mempty
      Just bytes -> liftIO (sftpWriteFileFromBytes sftpHandle bytes) >> loop

streamFromS3ToSftp :: forall m
  .  MonadAWS m
  => MonadUnliftIO m
  => MonadReader Sftp m
  => BucketName -> ObjectKey -> m ()
streamFromS3ToSftp bucketName objectKey = do
  streamFromS3 <- getStreamFromS3 bucketName objectKey
  sftp <- ask
  withSftpHandle sftp fileName $ \sftpHandle ->
    runConduitRes (streamFromS3 .| streamToSftp sftpHandle)
  where
    fileName = objectKey ^. keyName '/' . to unpack

withSftpHandle :: MonadUnliftIO m => Sftp -> FilePath -> (SftpHandle -> m a) -> m a
withSftpHandle sftp remote = bracket
  (liftIO $ sftpOpenFile sftp remote 0o644 [FXF_WRITE, FXF_CREAT])
  (liftIO . sftpCloseHandle)

_streamBodyM :: MonadIO m => RsBody -> ConduitT () ByteString (ResourceT m) ()
_streamBodyM (RsBody body) = transPipe (transResourceT liftIO) body
```

</spoiler>