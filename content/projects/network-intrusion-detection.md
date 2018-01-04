+++
date = "2017-05-28T00:47:00+01:00"
title = "Network intrusion detection/prevention system: Advanced Network Security course project"
+++

For the course [ET4307IN Advanced Network
Security](http://networksecuritycourse.nl) I had to develop an intrusion
detection/prevention system. This system does the following:

* capture live data from the NIC and save data to / read data from a pcap file.
* capture and parse DNS packets according to RFC1035, with (as required) a
  custom parser. It gracefully ignores record types added in later versions of
  the DNS protocol.
* Log ARP packets (parsed with a custom parser, as required) that have generated
  an error or notice via a custom configuration.
* An 802.11 module that detects a potential disassociation or deauthentication
  attack on the wireless network.
* Detect ARP-request-replay attacks.
* A bloom filter implementation (custom, as required) to speed up firewall rule
  processing in comparison to a hash table based approach.
* Connection tracking and rate-limiting functionality (DDoS prevention) on OSI
  layers 3 and 4.

All of this is implemented in a modular design, using Go. The source code can be
found on [GitHub](https://github.com/Hjdskes/ET4397in).
