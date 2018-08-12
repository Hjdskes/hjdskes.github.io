+++
date = "2017-12-11T00:47:00+01:00"
title = "Quadrupel: an embedded software project to stabilize a drone"
+++

For the course [IN4073 Embedded Real-Time
Systems](http://www.st.ewi.tudelft.nl/~koen/in4073/) my project group
and I had to program the software of an embedded control unit of a
drone (dubbed the Quadrupel), to provide stabilization such that it
can hover and fly with limited user control.

Our drone managed to take off, fly and land safely. Our response time was high
enough for adequate stability, which we managed to do by:

1. using a simple, custom message format on top of the
   [COBS](https://en.wikipedia.org/wiki/Consistent_Overhead_Byte_Stuffing)
   protocol to communicate between the base station (a PC) and the drone,
2. sticking to a small and simple code base implementing a finite state
   machine,
3. thoroughly reviewing each other's pull requests.

We also managed to implement a nice TUI on the base station, height control on
the drone and wireless flying. In fact, the drone was almost equally responsive
wirelessly as it was tethered, surpassing even the implementation of the lab
assistants 😄

The code is private, since future iterations of this course will be held.
