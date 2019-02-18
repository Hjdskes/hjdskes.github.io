+++
date = 2018-07-04T20:47:00+02:00
title = "Managing my passwords with pass"
description = "How I manage my passwords with pass on multiple devices"
tags = ["pass","gpg","git"]
categories = ["Administration", "Server"]
+++

Last week, I received an email from Ticketmaster that [my account
details may have been
leaked](https://veiligheid.ticketmaster.nl/en-us/) through an external
supplier. Whilst I did not get notified through Troy Hunt's excellent
[Have I Been Pwned?](https://haveibeenpwned.com), now was a good a
time as any to finally apply some proper password hygiene. A great
time, even, as this has been on my to-do list for way too long. I have
been preaching proper password hygiene to my family and friends whilst
not yet practicing it myself! It was finally time to put my money
where my mouth is. To walk the walk... you get it.

# What is proper password hygiene?

You've probably heard it a thousand times already, but let me refresh
your memory. Proper password hygience consists of the following:

1. Use unique passwords, or at the very least use unique passwords for
   important accounts.
2. Use a password manager. A password manager can generate secure
   passwords and store these securely. The only password that you will
   need to remember, is the password needed to log in to or unlock the
   password manager.
3. Do not write your passwords down where other people can see them. A
   paper in your safe? Fine. A sticky note on your desktop?
   Nah. Hotel? Trivago.
4. This isn't stricly related to passwords, but if possible, also use
   two factor authentication.

My threat model here is simply curious people (think snooping family
and friends) and criminals on the internet (phishing, hacking, et
cetera). Nation state actors or big-time criminals are out of the
question, so that file in your safe is probably fine.

Of course, you also shouldn't use *too easy* passwords. This is one
place where password managers shine: they can generate random
(*actually* random) passwords for you.

# Pass

[Pass](https://passwordstore.org) is *"the standard Unix password
manager"*. Pass is simple: each password is stored in a GPG encrypted
file, whose filename is the title of the website or account that
requires the password. The directory structure is completely up to
you, and can be copied to multiple devices and manipulated with your
favorite file management tools, be it the command line or a graphical
tool like Nautilus.

It is this transparency and use-of-use that I appreciate. There is no
new file format or paradigm to learn, no new mental model to create
and work with. I am in control of how and where the password store is
stored and where and how it is synced, instead of relying on some
cloud service managed by someone else. I can inspect the code because
it is *simple*, and I can rely on the strenght of GPG instead of a
home-grown encryption implementation. I am not trying to discredit
other password managers, but to me these are very important factors to
consider: I don't have to rely on trust; I can verify.

I won't explain how to set up and use pass, as both its website and
man page are excellent resources. You do need a GPG key pair; if you
don't have one yet I recommend reading [Debian's
how-to](https://keyring.debian.org/creating-key.html).

# Syncing your password store between multiple devices

So now you have a super secure password store on your PC. Memorizing
every password is impossible, let alone not the point of a password
manager. How do you sync it to your phone, or your work device?
Because you can use all your standard file management utilities, you
can also use Git. Pass even has built-in support for this! If a Git
repository is initialized, pass automatically creates a commit every
time the password store is manipulated through the invocation of
`pass`. You only need to add a remote and manually push your changes
to it.

To sync this Git repository, [my server](/blog/server/) hosts a Git
server accessible only within my local network. In theory this isn't
required, because your files are encrypted (and I'm sure there are
people out there syncing to a public GitHub repository). However, I do
like the extra assurance that my (encrypted) passwords are stored
somewhere private and under my own control. To see how to set up a Git
server, see the [Git
book](https://git-scm.com/book/en/v2/Git-on-the-Server-The-Protocols).

To manage this repository on my Android phone, I use [Android Password
Store](https://github.com/zeapo/Android-Password-Store). It has
built-in Git and GPG support. It can access your Git repository either
through SSH or HTTP. For my server, I only allow SSH connections
through SSH key pairs, so I set up a new pair using the Android
Password Store app and added the public key to my server.

As for the GPG key, you don't want to use your master key pair. This
would require you to copy that to your phone. In case your phone gets
stolen, lost or broken into, your private key is compromised and you
lose your complete online identity. To remedy this, GPG supports
subkeys. A subkey is like a normal encryption key, except it is bound
to your master key pair. It can be used for signing and encrypting
only, but the real useful part is that it can be revoked and stored
independently of your master key. See [Debian's
subkey](https://wiki.debian.org/Subkeys) article on how to create and
manage subkeys. When you have created your subkeys, copy one of them
to your Android device, load it into the
[OpenKeychain](https://github.com/open-keychain/open-keychain) Android
application which is used by Android Password Store to manage GPG
keys. Now you only have to point Android Password Store to your Git
repository and you are *almost* good to go! Your passwords are
encrypted with your master key, which means your phone cannot decrypt
them using your subkey. To solve this, simply run `pass init
$MASTERKEYID $SUBKEYID` to encrypt your passwords with both keys (yes,
this is safe to do in an existing password store). Don't forget to
sync this change between your devices.

There you go! Now you can transparently manage your passwords and have
full control over how and where they are stored.
