+++
date = 2019-06-28T21:54:19+02:00
title = "An update on HTTPS certificate issues"
description = "The certificate has been renewed and HTTPS should once again work"
tags = ["https","github pages","custom domain"]
categories = ["Administration"]
+++

For a little over a year now, this website has been enforcing HTTPS over both
its `www` subdomain and the `hjdskes.nl` apex domain. These certificates are
kindly provided automagically by GitHub in a partnership with [Let's
Encrypt](https://letsencrypt.org/).

In May, the certificate for my website expired. Expecting GitHub to be on top
of this, at first I did not take any action. Some of you have reached out to me
about the issue, which prompted me to contact GitHub to figure out why my
certficate wasn't being renewed.

They replied very quickly (thanks!), and at first my `AAAA` records seemed to
be the issue as GitHub Pages currently doesn't support IPv6 (I thought I
followed GitHub's instructions to the letter when I set up HTTPS a year ago,
but I may remember wrong). This worked and my certificate was renewed. Yay!

However, I was still getting the expired certificate warning when browsing to
`https://hjdskes.nl`. A round trip with GitHub support later, it turns out that
[GitHub does not support creating a certificate that covers both your root
domain and your `www`
subdomain](https://github.community/t5/GitHub-Pages/Does-GitHub-Pages-Support-HTTPS-for-www-and-subdomains/m-p/7202#M495).
I do remember my website working just fine over both domains for the last year,
so how this worked (or didn't!) is a mystery to me. In any case, I have removed
the `A` records from my DNS settings (thus removing my apex domain,
`https://hjdskes.nl`) and now everything is fine and dandy again. With the
publishing of this blog post, all internal references should go over the `www`
subdomain.

The timing of this was a bit unfortunate, since I was away on vacation for two
weeks. This is one of the reasons that fixing this took over a month. I
apologise for any inconvenience and I thank those of you that have reached out
to me. It's always nice to know that people read what I have to say and care
enough to reach out!
