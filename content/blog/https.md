+++
date = 2018-05-02T11:41:05+02:00
title = "This website is now HTTPS only again!"
description = "GitHub enabled HTTPS support for custom domains"
tags = ["https","github pages","custom domain"]
categories = ["Administration"]
+++

From today, my website enforces HTTPS again! Github Pages have been supporting
HTTPS [since June
2016](https://blog.github.com/2016-06-08-https-for-github-pages/), so when my
website was reachable only through
[hjdskes.github.io](https://hjdskes.github.io) I got all of that for free. In
fact, because HTTPS is the future(tm), I enabled Github Pages' *enforce HTTPS*
feature in my website's settings.

Since March, my website is also reachable through
[(www.)hjdskes.nl](https://hjdskes.nl).  When I set this up, I knew I would
lose the ability to enforce HTTPS because up until yesterday, Github Pages did
not support HTTPS for custom domains. I thought this wouldn't be a big issue
for a low traffic (I assume; I am not using any analytics but let's be
realistic) blog like mine with only static content. Plus, [I
knew](https://github.com/isaacs/github/issues/156) that HTTPS support for
custom domains would eventually come, so I went ahead and set things up.

I forgot all about this until yesterday, when I saw a broadcast on GitHub
informing the world about [HTTPS support for custom
domains](https://blog.github.com/2018-05-01-github-pages-custom-domains-https/).
[An update to my DNS' A records
later](https://help.github.com/articles/setting-up-an-apex-domain/#configuring-a-records-with-your-dns-provider)
and here we are: HTTPS is again enforced for this website, and all I had to do
for it was update some DNS settings. Thanks, GitHub!
