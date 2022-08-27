+++
date = 2022-08-27T20:32:18+02:00
title = "The Shiba project 🐕"
description = "Using technology to get a puppy"
tags = ["aws","haskell"]
categories = ["Projects"]
+++

It's a cool Saturday evening here in Stockholm. I'm sitting on the balcony with
my new best friend by my side and a cool beer on the table. I just spun down a
project that I [hinted to](/blog/haskell-nix-aws-lambda) over a year ago. Now's
a good time to reflect on it and explain what it was. Spoiler: it has to do
with my new best friend here.

{{< gallery "/img/blog/shiba/laszlo.jpg" >}}

In Sweden, buying a puppy is a well-controlled process. Only registered kennels
sell puppies. As with everything in Sweden, you'll have to queue up and wait
for your turn. Just as you'll be checking whether the puppy is a good fit for
your family, they'll be making sure that your family is a good fit for the
puppy. It can be a long process, but it truly has the best interest of the dogs
in mind. In our case, we had to wait for roughly two years before it was
finally our turn. That's partly because of the pandemic, during which many
kennels took a break from breeding, but also because the Shiba Inu is just a
rare dog in Sweden. There are only [around 10 active
kennels](https://www.skk.se/sv/kopahund/hundraser--annonser/shiba/?show=breeders)
across the whole country, and the average litter size is only three puppies.

One year ago we started to get serious about getting a dog. We had everything
in our lives in order and it felt right, but we knew we weren't in the front of
the queues yet. There are a few kennels that don't use a queueing system; they
announce the puppies on their website and match on a first come, first serve
basis. You can see where this is going: I automated the checking of their
websites, notifying us when there were any changes. Was the project succesful?
Well, we didn't end up getting our puppy through one of these kennels, so no.
But it was a fun project that I used to get familiar with some technologies we
still use today at work, and it was an opportunity to put my skills to use for
something useful and fun. Also, the wife approval factor was high, so I
definitely scored some points there 😉

The Shiba project is a simple web scraper, built using Haskell on AWS
serverless technologies. I periodically trigger a Lambda using a Cloudwatch
event, which uses [scalpel](https://hackage.haskell.org/package/scalpel) to do
the scraping. Scrape results are persisted in and compared to previous results
using DynamoDB, where the key is the websites to scrape and the values are the
scraped pages. If there is a difference between the new result and the
previous, we get a text message through SNS informing us that the website has
been updated.

I deployed the initial version of this project in April 2021, so it has been
running for one year and three months. The total cost has been 66 SEK (~$6),
due to the free tiers for Lambda, Cloudwatch and DynamoDB. The only thing I
ended up paying for was the text messages SNS sent.

As I said, it's nothing special. I probably could have used some off the shelf
components, even, or just run a simple script from my machine. It was good fun
though, and it allowed me to use the technologies we're using at work in a
freer context so I could experiment, learn and structure the project the way I
prefer them to be. It has the whole shebang: well-structured and documented
Haskell code, Nix, infrastructure as code with Terraform, and some GitHub
Actions workflows for every PR. I'm most proud of my hacks to [deploy a
Nixified Haskell binary on AWS Lambda](/blog/haskell-nix-aws-lambda/). If
you're curious to find out more, you can find it on [my
GitHub](https://github.com/Hjdskes/shiba).

My new best friend's name is Laszlo, and he just woke up. I'm going back to
spending some time with him.
