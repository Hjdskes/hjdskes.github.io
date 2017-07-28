+++
date = "2017-07-28T15:10:26+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "button", "rewrite", "merge" ]
title = "GSoC part 10: finishing the button stack page"
categories = "Development"
series = "GSoC"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

I can start this blog post by sharing the news that I have passed for my second
evaluation! This means that I'm now on the last sprint towards the finish line,
with ahead of me profile support and the welcome screen.

Yes; you've read that correctly: I didn't mention the button page. I managed to
fix that this week and it's now pending review and some final issues (more about
that below). Last week I explained that the biggest issue is the restriction
that ratbag places on its key mapping signature. My mentor [added macro
support](https://github.com/libratbag/libratbag/pull/248) to libratbag and
ratbagd, so that I could implement the proposed solution to merge the key
mapping and macros into one setting, as macros are a superset of key mappings
anyway. As you can see in [the
commit](https://github.com/libratbag/piper/pull/47/commits/7001904447cad84a13a8852b4487f976156e238f),
it's quite the cleanup. I also quickly added some code to print the proper
labels in the button stack page so that you see at a quick glance which button
does what. The end result, is this:

<video style="max-width: 110%; width: 110%;margin-left: -4%" controls>
  <source src="/img/blog/gsoc-part-10/buttons.webm" type="video/webm">
Your browser does not support the video tag.
</video>

Macros aren't entirely implemented just yet; they still need support for [button
releases](https://github.com/libratbag/piper/issues/56),
[timeouts](https://github.com/libratbag/piper/issues/57) and [both key presses
and releases](https://github.com/libratbag/piper/issues/62). However, the basics
are in and the PR was getting large, so it's good to get it merged and do those
features separate.

Last week also saw the point where the `rewrite` branch got
[merged](https://github.com/libratbag/piper/pull/63) into the master branch.
This means that all of the code I've been writing is now officially in use, and
if you pull from GitHub you too can now use the new Piper! My mentor decided it
was time because there have been quite a few
[changes](https://github.com/libratbag/libratbag/pull/242) in libratbag
and the DBus interface it presents so the old Piper didn't work anymore and it
makes no sense to update two versions; especially not when the rewritten version
supports *almost* everything the old one does.

The changes to the DBus interface resulted in an interesting scenario: Piper
maintains its own ratbagd <q>bindings</q> (glorified Python DBus wrappers to
talk with libratbag over DBus), but these are copied back into libratbag for its
`ratbagctl` tool. When ratbagd is changed, the bindings in that repository are
updated, and when Piper needs updates to its bindings, it updates the bindings
in its own repository. Because both happened simultaneously last week (and in
Piper's case, in a bunch of different branches as well), syncing the changes
back and forth was an interesting task
([1](https://github.com/libratbag/piper/pull/59),
[2](https://github.com/libratbag/piper/pull/61),
[3](https://github.com/libratbag/libratbag/pull/250) and
[4](https://github.com/libratbag/libratbag/pull/254)). Luckily my mentor told me
about [`git add -p`](https://git-scm.com/docs/git-add#git-add--p), a flag I
hadn't seen before which made the task significantly easier. The issues I
mentioned for the button page are related syncing the bindings and the ratbagd's
rewritten DBus interface. These aren't hard; I just haven't gotten around to
rebasing the buttons branch yet.

### Beginning the work on profiles

My mentor lives on the other side of the globe (Down Under), so we normally have
only a few hours overlap a day. This is enough to sync and get some work done
together, so this isn't a problem. This week, however, he was travelling to
visit [GUADEC](https://2017.guadec.org/) so I wasn't able to reach him for quite
a bit longer. This was in the middle of the DBus changes and macro support, both
of which I required to finish the buttons page. I did most of this work based on
his WIP branch, but I couldn't finish it before that PR got merged. Instead of
waiting around doing nothing, I started to work on the profile support:

<video style="max-width: 110%; width: 110%;margin-left: -4%" controls>
  <source src="/img/blog/gsoc-part-10/profiles.webm" type="video/webm">
Your browser does not support the video tag.
</video>

Whilst working on these, I noticed an issue in the bindings: the
`notify::enabled` signal (which notifies any subscribers of a change to this
property) would be emitted when disabling a profile, but not when
enabling it again. After some debugging with my mentor (who fortunately was back
online from Manchester), we found that when Piper asks ratbagd for a device's
profiles, a new Python list is returned. Since Piper is only connected to the old
list's profile objects, it never received the signal on those. The solution is to
simply [cache](https://github.com/libratbag/piper/pull/64) the lists to make
sure the bindings always return the same object.

### Piper development version

Up until now I had just been running `./piper.in` from the top level source
directory to test my changes. This is less than ideal, especially because it
still requires a compiled resources file. My solution was to generate that
through Meson (`ninja -C build`) and then manually copy that into place with
`cp build/data/piper.gresource data/`, but clearly this wasn't the way forward.

In [this pull request](https://github.com/libratbag/piper/pull/58) I fixed that.
Meson now takes `piper.in` and coughs out two versions: `piper` and
`piper.devel`. The latter has some code injected that modifies Python's search
path so that it loads Piper's modules from the source tree:

```meson
config_piper_devel = configuration_data()
config_piper_devel.set('pkgdatadir', join_paths(meson.build_root(), 'data'))
config_piper_devel.set('localedir', join_paths(meson.build_root(), 'po'))
config_piper_devel.set('devel', '
sys.path.insert(1, \'@0@\')
print(\'Running from source tree, using local files\')
'.format(meson.source_root()))

configure_file(input: 'piper.in',
	       output: 'piper.devel',
	       configuration: config_piper_devel)
```

This removes any development code from `piper.in` and, by extension, `piper`,
which is arguably cleaner. On the other hand, it does add [invalid Python
code](https://github.com/libratbag/piper/pull/58/files#diff-07d882117a676ac39c6d2cee78a8876aR14)
to `piper.in` so it has to be ignored by flake8. This resulted in an interesting
discussion between bentiss and myself, about whether it's worth to have a new
source file versus this, well, hack. We settled on merging the PR, because both
generated versions are still checked by flake8, and so by extension so is
`piper.in`.

Skipping over a few smaller, less visible pull requests, that's it for this
week! Next week I'll focus on rebasing the buttons branch and architecting the
profile support. I expect to spend more time than usual on architecture for
that, while the code should then be relatively simpler. Let's see how I'll
manage to thread this out through the existing codebase!

This blog post is part of a series. You can read the previous part about the
button page [here](/blog/gsoc-part-9).
