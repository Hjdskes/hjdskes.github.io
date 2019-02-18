+++
date = "2016-08-16T22:07:21+02:00"
title = "Deploying Hugo-generated websites on personal GitHub Pages"
description = "How I deploy my Hugo generated website to GitHub Pages"
tags = [ "Hugo", "GitHub Pages" ]
categories = ["Administration"]
+++

{{% message type="info" %}} The method described here is obsolete. The
introduction still provides a nice overview of the problem, but please see my
[updated post](/blog/update-deploying-hugo-on-personal-gh-pages) for the actual
steps and scripts! {{% /message %}}

*<q>Hello, World!</q>*

As this is the first blog post on this website (and indeed, by myself), the
introduction had to be done. I'll leave it at this, though. If you want to know
more about me, you can do that [here](/about/).

This website is created using the [Hugo](https://gohugo.io/) static website
generator. You define the layout of your pages using regular HTML (combined with
Hugo's [templates](https://gohugo.io/templates/overview/)), CSS and JavaScript
and you write your pages' contents using Markdown. Hugo takes these source files
and generates the HTML files for you. All you have to do afterwards is deploy
these files on your server.

[GitHub Pages](https://pages.github.com) is a service by GitHub allowing you to
create websites for yourself, your organization and your projects. These
websites are hosted directly in a GitHub repository under your control; simply
pushing changes to these repositories updates the website.

This blog post explains how I combined the two: the website's contents are
created using Hugo and are deployed through GitHub Pages.

## Deploying your Hugo-generated website on GitHub Pages

There is a [good tutorial](https://gohugo.io/tutorials/github-pages-blog/) on
deploying your Hugo-generated website on GitHub Pages on the Hugo website. The
scenario described there, however, does not really fit my use-case.

The tutorial applies to a GitHub Pages website belonging to a project. This
means that the website needs to be pushed into the `gh-pages` branch under
said project's GitHub repository.

In my case, I'm using Hugo to generate a personal website. This means that I
have a `$USERNAME.github.io` repository, and consequently that my website's
contents need to be pushed into that repository's `master` branch.

The above mentioned tutorial does have a small section on hosting the website on
personal GitHub Pages, but I find their solution to use two repositories (one
for the sources and another for the generated website) to be sub-par. A Google
search led me to
[this](http://life.beyondrails.com/blog/2014/12/14/setting-up-and-automating-my-hugo-blog-deployment-to-github-pages/)
blog post where the author struggled with the same issue. What follows
is my solution, combining both tutorials.

As mentioned, I have a `$USERNAME.github.io` repository. My website's content
should be deployed into the `master` branch, starting with a valid `index.html`
in this branch's root. Not wanting to mix source- and generated files, I
intended to keep Hugo's default setting to generate the website into a separate
directory called `public/`. As you can see, these two options are at odds.

I therefore adopted the `git subtree` approach as initially suggested in the
Hugo tutorial: have a "source" branch for the source files, which contains a
`public/` folder mirroring the root of the `master` branch containing only the
generated website. The workflow, then, would be something like this:

1. Make a change to the website;
2. Commit those changes;
3. Use Hugo to generate the new website;
4. Push the new `public/` folder to the "source" branch;
5. Push the contents of the new  `public/` folder to the `master` branch using
   `git subtree`.

This would allow me to have one branch for my source files, and to use the
`master` branch for the generated website only, resolving my issue. Steps two
to five can be automated, although personally I prefer to do step two myself.
However, for steps three to five I have written a small script, `deploy.sh`:

```bash
#!/usr/bin/env bash

# This script allows you to easily and quickly generate and deploy your website
# using Hugo to your personal GitHub Pages repository. This script requires a
# certain configuration, run the `setup.sh` script to configure this. See
# https://hjdskes.github.io/blog/deploying-hugo-on-personal-github-pages/index.html
# for more information.

# Set the English locale for the `date` command.
export LC_TIME=en_US.UTF-8

# GitHub username.
USERNAME=hjdskes
# Name of the branch containing the Hugo source files.
SOURCE=hugo
# The commit message.
MESSAGE="Site rebuild $(date)"

msg() {
    printf "\033[1;32m :: %s\n\033[0m" "$1"
}

msg "Pulling down the \`master\` branch into \`public\` to help avoid merge conflicts"
git subtree pull --prefix=public \
	git@github.com:$USERNAME/$USERNAME.github.io.git master -m "Merge master"

msg "Building the website"
hugo

msg "Pushing the updated \`public\` folder to the \`$SOURCE\` branch"
git add public
git commit -m "$MESSAGE"
git push origin "$SOURCE"

msg "Pushing the updated \`public\` folder to the \`master\` branch"
git subtree push --prefix=public \
	git@github.com:$USERNAME/$USERNAME.github.io.git master
```

I have written a second script to take care of the setup, in case I ever need
to repeat the steps for another website. This script needs to be run only once;
afterwards, `deploy.sh` does all the work. The script will create an empty,
orphaned `master` branch, which from then on is not supposed to be touched
manually. To start with a clean history, I have opted to delete the existing
`master` branch (both local and remote), if any. Note that GitHub does not allow
you to delete the default branch, which, by default (pun intended) is the
`master` branch. Since I never touch the `master` branch, I changed the default
branch to the "source" branch, allowing me to delete the `master` branch. To
change the default branch, open your GitHub repository and go to Settings →
Branches.

{{% message type="warning" %}} This script will delete the `public/` directory.
Make sure any files you want to keep are backed up! {{% /message %}}

```bash
#!/usr/bin/env bash

# This script does the required work to set up your personal GitHub Pages
# repository for deployment using Hugo. Run this script only once -- when the
# setup has been done, run the `deploy.sh` script to deploy changes and update
# your website. See
# https://hjdskes.github.io/blog/deploying-hugo-on-personal-github-pages/index.html
# for more information.

# GitHub username
USERNAME=hjdskes
# Name of the branch containing the Hugo source files.
SOURCE=hugo

msg() {
    printf "\033[1;32m :: %s\n\033[0m" "$1"
}

msg "Deleting the \`master\` branch"
git branch -D master
git push origin --delete master

msg "Creating an empty, orphaned \`master\` branch"
git checkout --orphan master
git rm --cached $(git ls-files)

msg "Grabbing one file from the \`$SOURCE\` branch so that a commit can be made"
git checkout "$SOURCE" README.md
git commit -m "Initial commit on master branch"
git push origin master

msg "Returning to the \`$SOURCE\` branch"
git checkout -f "$SOURCE"

msg "Removing the \`public\` folder to make room for the \`master\` subtree"
rm -rf public
git add -u
git commit -m "Remove stale public folder"

msg "Adding the new \`master\` branch as a subtree"
git subtree add --prefix=public \
	git@github.com:$USERNAME/$USERNAME.github.io.git master --squash

msg "Pulling down the just committed file to help avoid merge conflicts"
git subtree pull --prefix=public \
	git@github.com:$USERNAME/$USERNAME.github.io.git master
```

You can find the structure and setup in use in [this website's
repository](https://github.com/Hjdskes/hjdskes.github.io). If any of the above is
unclear, feel free to send me an [email](mailto:hjdskes@gmail.com) and I'll try
my best to update this post.
