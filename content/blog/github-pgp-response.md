+++
date = 2019-01-02T11:47:43+01:00
title = "An update from GitHub on PGP subkeys"
description = "GitHub's response to my report about adding new subkeys"
tags = ["pgp", "gnupg", "github", "gitlab", "subkey"]
categories = ["Administration"]
+++

A few weeks ago I wrote about adding a [new PGP subkey to your GitHub account](/blog/psa-github-gpg).
I reported this issue to GitHub when I discovered it. Today, I have gotten a response from GitHub:

> When a new subkey is added to an existing PGP key on an account, it
> currently has to be removed and added back to the account to update it
> on our side.
>
> This is expected behaviour for now but I agree it isn't the most
> elegant solution! We'll pass your request onto the team to consider.
>
> I can't promise if or when we'd add this but we'll make sure the
> request is in the right hands.

So, perhaps this will work properly in the future, or at least be
documented behavior ☺ I have now also [reported this issue to
GitLab](https://gitlab.com/gitlab-org/gitlab-ce/issues/55864), which I
forgot to do earlier because I had a plane to catch.
