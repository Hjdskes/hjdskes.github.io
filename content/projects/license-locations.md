+++
date = "2017-02-21T00:47:00+01:00"
title = "License locations: proof of concept code for a draft research paper"
type = "University"
+++

For the course [IN4252 Web Science &
Engineering](http://studiegids.tudelft.nl/a101_displayCourse.do?course_id=38331)
I wrote a draft research paper, titled *Open source software licenses: is
there a correlation between developer location and software licenses?*. In this
paper I attempted to map the use of free and open source software licenses, in
order to see whether a developer's geographic location is a determinant of FOSS
license choice. If you are interested in reading the draft (it was never
required to go further, and never did), please [reach out to
me](mailto:hjdskes@gmail.com) and I will send it to you.

The proof of concept code reads users' locations from a datadump of GitHub
acquired from the [GHTorrent](http://ghtorrent.org) project. This project,
however, did not store project licenses (though it may by now), so I wrote some
code to augment the data with the project license. This is done by querying
GitHub through its API for every project for every user. Note however that this
is done for the first 5000 users only, as this is the rate limit set by GitHub
and it was only a proof of concept anyway. To see how to set it all up, should
you want to do the same, see the README in the project.

The code is written in Go. I did not pay attention to speed, robustness nor ease
of use. Find the source code on [GitHub](https://github.com/Hjdskes/license-locations).
