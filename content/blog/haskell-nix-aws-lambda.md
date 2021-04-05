+++
date = 2021-04-06T00:28:18+01:00
title = "Deploying a Nixified Haskell binary on AWS Lambda"
description = "Or how I de-Nixified a binary"
tags = ["aws","lambda","haskell","nix"]
categories = ["Projects"]
+++

For a current project (which I will be writing about soon!), I need to deploy a Haskell binary to AWS Lambda. Thankfully, there is a [great library](https://theam.github.io/aws-lambda-haskell-runtime/) out there that allows Haskell code to interface with AWS Lambda. Unfortunately, Haskell is [not officially supported](https://aws.amazon.com/lambda/faqs/) so I needed to jump through some hoops in order to run my code.

In this post I describe the process I followed to make this work. I assume as little Haskell and Nix knowledge as possible for the problem description and the solution, but inevitably when I show the code some things might not make sense if you're not familiar with Nix. If anything is unclear reach out to me on my Twitter or send me an e-mail (links are in this page's footer) and I'll try to clarify. That said, let's dive in!

## Custom runtimes on AWS Lambda

AWS Lambda officially supports a number of runtimes. A runtime is a program that runs the Lambda's `handler` function when the Lambda function is invoked, all per the AWS Lambda service contract. A [custom runtime](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html) then is nothing more than a binary named `bootstrap` that exposes such a function. Hence, what I need to run my code is a Haskell binary named `bootstrap`.

But it doesn't stop just there: Haskell compiles to native code. While this is beneficial for multiple reasons, it has one drawback when deploying code on AWS Lambda (or other platforms in general): [linking](https://en.wikipedia.org/wiki/Linker_(computing)) shared object files between different platforms. With compiled code, one can either include all the dependencies in the binary (static linking) or have the operating system supply them and link them at runtime (dynamic linking). By default, Haskell code  compiled with GHC is dynamically linked. That means that GHC, during compilation, uses the libraries of the host system as the linking target. This results in a binary dependent on the host's library versions and paths. Hence, a binary that I compile on my machine only runs on AWS Lambda if the libraries on my system are compatible with those of AWS Lambda. A solution to this problem would be to compile a statically linked binary, but unfortunately this is notoriously difficult to do with GHC Haskell.

This is aggravated further due to the fact that I am building my project with Nix. In order to be fully deterministic and reproducible, Nix deviates from the [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/fhs.shtml) and instead relies on what is called the "Nix store" under `/nix/store`[^1]. To make this work Nix has to patch any binary it produces to point to shared objects and ELF interpreters in its store. Simply packaging the entire Nix store with my binary is not an acceptable solution, because it is far too large[^2].

Nix packagers have often run into this problem and have developed a number of tools that allows them to patch binaries. There is even a dedicated resource that describes [how to patch binaries](https://nixos.wiki/wiki/Packaging/Binaries) to work with Nix for which the source code is unavailable. But if one can patch a binary to work _with_ Nix and the Nix store, can one also reverse this process and patch a binary to work _without_ Nix? Spoiler alert: you can!

## De-nixifying a binary

After compiling my Haskell code with Nix I have a binary that is dynamically linked against shared object files that are available in the Nix store:

```bash
 λ ldd result/bootstrap 
        linux-vdso.so.1 (0x00007fff4e3d9000)
        libpthread.so.0 => /nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/libpthread.so.0 (0x00007fe4798a5000)
        libz.so.1 => /nix/store/z39zr65hrbimzh40mxmdbpz64ma4b5vy-zlib-1.2.11/lib/libz.so.1 (0x00007fe479888000)
        librt.so.1 => /nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/librt.so.1 (0x00007fe47987e000)
        libutil.so.1 => /nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/libutil.so.1 (0x00007fe479879000)
        libdl.so.2 => /nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/libdl.so.2 (0x00007fe479872000)
        libgmp.so.10 => /nix/store/ks724y9k5skmsr5y4gii28nfqrb1r5bj-gmp-6.2.0/lib/libgmp.so.10 (0x00007fe4797d0000)
        libc.so.6 => /nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/libc.so.6 (0x00007fe479611000)
        libm.so.6 => /nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/libm.so.6 (0x00007fe4794d0000)
        libffi.so.7 => /nix/store/mqr1hbh7jmgpmdfd7bb0yr54brb1b9xy-libffi-3.3/lib/libffi.so.7 (0x00007fe4794c3000)
        libnuma.so.1 => /nix/store/dgb0w5fsdym9k2hazvnbhsknrbmbi8a2-numactl-2.0.13/lib/libnuma.so.1 (0x00007fe4794b4000)
        /nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/ld-linux-x86-64.so.2 => /nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib64/ld-linux-x86-64.so.2 (0x00007fe4798c8000)
```

You can see in that output that the `bootstrap` binary depends on shared objects such as `libpthread.so.0` (`.so` stands for "shared object") and that this dependency is currently satisfied by `/nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/libpthread.so.0`. That's not the only thing, however. The binary also instructs the operating system which dynamic loader ("ELF interpreter") to use to load the shared objects. When the binary is to be executed, the operating system looks up the interpreter and the interpreter loads the shared object files. This interpreter's path is hardcoded in the binary and also points to the Nix store:

```bash
 λ patchelf --print-interpreter result/bootstrap 
/nix/store/33idnvrkvfgd5lsx2pwgwwi955adl6sk-glibc-2.31/lib/ld-linux-x86-64.so.2
```

Hence, in order for my binary to be able to run on AWS Lambda, I need to:

1. Package the shared object files (including the dynamic loader) from the Nix store that the binary depends on and the binary itself in the zip file that I upload to AWS Lambda, and
2. Patch the binary to point to the dynamic loader that I provided.

`patchelf` is one of those tools developed by the Nix community that makes it easy to patch binaries. I can change the dynamic loader using `patchelf --set-interpreter /absolute/path/to/interpreter result/bootstrap`. I can fetch all the shared object files that the binary depends on with this short line: `cp $(ldd result/bootstrap | grep -F '=> /' | awk '{print $3}') .`. If I were to package this (assuming I did indeed set the correct path to the interpreter), my Lambda would segfault.

As per usual, there is _one more thing_: ensuring that the packaged shared objects are resolved _first_. Shared object files can be installed in a number of places. These directories are tried in certain order and as soon as a shared object file is found, directories further down the list are not tried. This is synonymous to how the `$PATH` environment variable describes a list of directories that contain executables. The environment variable that controls the list of directories that are scanned for shared libraries is [`LD_LIBRARY_PATH`](https://tldp.org/HOWTO/Program-Library-HOWTO/shared-libraries.html).

On AWS Lambda, the default value for `LD_LIBRARY_PATH` is `/lib64:/usr/lib64:$LAMBDA_RUNTIME_DIR:$LAMBDA_RUNTIME_DIR/lib:$LAMBDA_TASK_ROOT:$LAMBDA_TASK_ROOT/lib:/opt/lib`, where `$LAMBDA_TASK_ROOT` is the path to the Lambda function code (i.e., where the zip file will be unpacked). At the time of writing the default value is `/var/task`. `$LAMBDA_RUNTIME_DIR` is the path to runtime libraries, which at the time of writing is `/var/runtime`.

As this default value of `LD_LIBRARY_PATH` shows, the standard directories for shared object files (`/lib64` and `/usr/lib64`) have precedence. Since the shared object files packaged with my Haskell binary are those for common system libraries such as glibc, unfortunately the system shared object files will be found first. This leads to incompatible library versions. No bueno.

## Getting AWS Lambda to find and load our shared object files

The solution is simple: just like we can override `$PATH`, we can also override `$LD_LIBRARY_PATH`! If we were to e.g. use `export LD_LIBRARY_PATH=$LAMBDA_TASK_ROOT:$LD_LIBRARY_PATH`, we would give our libraries (that are unpacked to `$LAMBDA_TASK_ROOT`) precedence: muy bueno! There is just a _slight_ problem: where do we export this new value for `$LD_LIBRARY_PATH`? We cannot do it programmatically in our binary, because that leads to a chicken/egg problem: to load the binary, we need to override the library path. But to override the library path, we need to run our binary!

Everything can be solved with another layer of indirection. Fortunately for me, "everything" includes this problem, too! I can wrap my binary with a small shell script that sets the library path and then loads my Haskell binary:

```bash
#!/usr/bin/env bash
cd "${0%/*}"
export LD_LIBRARY_PATH=$LAMBDA_TASK_ROOT:$LD_LIBRARY_PATH
exec -a "$0" "./haskell-binary" "$@"
```

This script first changes directory to the one holding the invoked script. The script then overrides the library path to give `$LAMBDA_TASK_ROOT` precedence, before replacing itself with the Haskell binary. With this, the Haskell binary now runs on AWS Lambda! _"But Jente"_, you ask, _"if you're done now, then why am I only halfway through this post?"_. Well, dear reader, you're about to find out!

While the above works just fine, it is inelegant and encodes system-specific behaviour. I now need a wrapper script with a dependency on Bash and I override an environment variable that affects the behaviour of the system. There is a more elegant way that is completely self-contained: we can also encode the search paths for shared object files into the binary!

The so-called `rpath` is an entry in the binary that lists directories to search for shared object files. `rpath` is searched _before_ `$LD_LIBRARY_PATH` (and hence cannot be influenced at runtime) which means that if I point the `rpath` of the binary to the folder containing the packaged shared object files, those will _always_ take precedence. Furthermore, while `$LD_LIBRARY_PATH` requires absolute paths, `rpath` can include relative paths and hence the binary can be made location independent.

I can set the `rpath` with (you guessed it) Nix's `patchelf`. Let's say I copied all the shared object files into `./lib`, then I'd set the `rpath` of the bootstrap binary like so: `patchelf --set-rpath lib/ result/bootstrap`. So long as there is a `lib` directory next to the binary (wherever it may be on the filesystem, it is location independent!) containing the object files, AWS Lambda will load them. Or does it?

Of course not, it'd be silly to assume that things worked on the first try! It turns out that there are _two_ values one can set to encode runtime paths in a binary: `DT_RUNPATH` and the obsolete `DT_RPATH`. They are alike in behaviour, they differ only in their priority: while `rpath` is scanned _before_ `$LD_LIBRARY_PATH`, `runpath` is read _after_. Since `rpath` is obsolete, by default `patchelf --set-rpath` sets the `runpath` value. Fortunately for me, `patchelf` has a `--force-rpath` option that changes this behaviour and sets `rpath` instead. The correct `patchelf` invocation thus becomes `patchelf --set-rpath ./lib --force-rpath`.

_Now_ it works 🍾

## Packaging all this into a Nix derivation

What rests me now is to write a Nix derivation that takes as input a Haskell binary and produces as output a zip file that is ready to be uploaded to AWS Lambda. A piece of code says more than a thousand words, so here you go:

```nix
{ pkgs ? import ./haskell.nix
, hsPkgs ? import ./default.nix {} }:

let
  buildLambda = cabalProject: executable:
    let
      exeComponent = hsPkgs.${cabalProject}.components.exes.${executable};
    in
      pkgs.stdenv.mkDerivation {
        name = executable;
        buildInputs = with pkgs; [ exeComponent patchelf zip ];
        src = ./.;
        phases = [ "installPhase" ];

        installPhase = ''
          mkdir $out/
          pushd $out/

          # Copy the binary to `bootstrap`, which is what AWS Lambda expects:
          # https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html
          cp ${exeComponent}/bin/${executable} bootstrap

          # Copy the shared objects that our binary depends on to a subfolder `lib/`.
          mkdir lib
          cp $(ldd bootstrap | grep -F '=> /' | awk '{print $3}') lib/

          # Patch the binary to point the ELF interpreter and the run-time search
          # path to the shared objects we provide. Note that these paths are location
          # independent: as long as the binary is in the same directory as the folder
          # containing our shared objects, this will work.
          chmod +w bootstrap
          patchelf --set-interpreter ./lib/ld-linux-x86-64.so.2 --set-rpath ./lib --force-rpath bootstrap
          chmod -w bootstrap

          # Finally, we can zip up our binary and the subfolder holding our shared objects.
          # This zip file is the output artefact of this derivation and can be uploaded to AWS
          # Lambda as-is.
          zip -qr ${executable}.zip .

          rm -r lib bootstrap
          popd
        '';
      };
in
  buildLambda "shiba" "shiba-scraper"
```

The files haskell.nix and default.nix are standard [haskell.nix](https://github.com/input-output-hk/haskell.nix) definitions, but for the sake of completion I'll paste them below[^3].

## Conclusion

With the above you should have all that you need to deploy a Haskell binary that is built with Nix to AWS Lambda. If you've found this helpful, I'd love to know! If there's anything that is unclear or if you've spotted a bug, I'd love to know that too! You can reach out to me on Twitter or over e-mail, the links are in this page's footer. If you want to read up more on shared libraries, I found Amir Rachum's [Shared Libraries: Understanding Dynamic Loading](https://amir.rachum.com/blog/2016/09/17/shared-libraries/) an inspiring read. Thanks to [Renzo Carbonara](https://ren.zone/) for [the `ldd` trick](https://github.com/k0001/aws-lambda-nix-haskell/blob/master/default.nix) to fetch a binary's dependencies.

And yes, those are teasers as to my current project. I'll write about that when I have something to show! 🐕

[^1]: For a good read on this I suggest [Serokell's What Is Nix](https://serokell.io/blog/what-is-nix)

[^2]: I could copy only those store paths that I need, but then I'd still have to modify `LD_LIBRARY_PATH` so that those libraries get precedence. Alternatively I'd have to have a list of all packages that provide those store paths to use `patchelf --set-rpath ${lib.makeLibraryPath [ <packages> ]}`. That is more tedious than my current solution.

[^3]: default.nix:
    ```nix
    { pkgs ? import ./haskell.nix }:

    pkgs.haskell-nix.project {
      src = pkgs.haskell-nix.haskellLib.cleanGit {
        name = "shiba";
        src = ./.;
      };
      compiler-nix-name = "ghc8104";
    }
    ```
    haskell.nix:
    ```nix
    let
      haskellNix = import (builtins.fetchTarball "https://github.com/input-output-hk/haskell.nix/archive/e7961eee7bbaaa195b3255258f40d5536574eb74.tar.gz") {};
      nixpkgsSrc = haskellNix.sources.nixpkgs-2009;
      nixpkgsArgs = haskellNix.nixpkgsArgs;
    in
      import nixpkgsSrc nixpkgsArgs
    ```
