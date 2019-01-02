+++
date = 2018-12-13T15:23:39+01:00
title = "PSA: want to use a new subkey to sign your commits?"
description = "Here's what to do to get it picked up by GitHub & GitLab"
tags = ["pgp", "gnupg", "github", "gitlab", "subkey"]
categories = ["Development","Administration"]
+++

I [~~not so~~](/blog/pass/) recently started
using [subkeys](https://wiki.debian.org/Subkeys) to do my normal PGP
work. I made a new subkey specifically for signing things, and
naturally wanted to use this new key to sign my commits with git's
builtin GPG support. I picked up my subkey's ID with `gpg --list-keys
--keyid-format LONG` and set it with `git config --global
user.signingKey <id>`. That'd be it, right?

Since you're reading this, you've found out the answer is
*"no"*. First, GPG by default uses the last created subkey for
signing. If this is your problem, you need to [append an exclamation
mark to your key's
ID](https://public-inbox.org/git/20180113002221.GQ29313@zaya.teonanacatl.net/),
i.e., use `git config --global user.signingKey <id>\!`.

However, if this *isn't* your problem (i.e., if you want to use a new
and hence last created subkey to sign your commits), what do you do?
If you go to your GitHub (or GitLab)
[settings](https://github.com/settings/keys), you'll see your current
GPG key with a list of subkeys. Your new subkey probably isn't there
(or you wouldn't be reading this article). How do we get it there?

If you try to re-add your GPG key, you get a red warning that this key
already exists. Bummer. Apparently GitHub doesn't pick up the fact
that there are new subkeys. The solution to this problem is to remove
your current GPG key and then add it again. This may look scary,
especially given the warning that "***any commits you signed with this
key will become unverified after removing it***". However, don't
worry: as we are adding this same key back, those commits will all
become verified again. In fact, even the commits I made since starting
to use subkeys suddenly became verified as well. This same trick works
on GitLab, by the way.

### Update Jan 2 2019

I reported this issue when I discovered it. [I have now gotten a
response](/blog/github-pgp-response).
