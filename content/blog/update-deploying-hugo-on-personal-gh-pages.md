+++
date = "2017-02-26T22:12:00+01:00"
title = "Update: deploying Hugo-generated websites on personal GitHub Pages"
+++

In my [previous post](/blog/deploying-hugo-on-personal-gh-pages) I explained the
workflow I use to update this website. It has never been particularly stable,
and the process seemed far more complicated than it needed to be.

This week I attempted to update the theme of this website (sidenote: thanks
[Alexis Tacnet](https://github.com/fuegowolf) for your awesome theme and
cooperation!). To pull in the theme's files, I use [git
submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules). Apparently,
this completely break git's subtrees. I had enough of trying to maintain
this complicated setup, so I started looking around for better ways.

Fortunately, Hugo's "Hosting on GitHub" tutorial has been updated to include
instructions on [deploying via a `gh-pages`
branch](https://gohugo.io/tutorials/github-pages-blog/#deployment-via-gh-pages-branch).
The instructions are easily modified to work with the setup that personal pages
require! If you want to know how it works, read that tutorial; what follows
below are my updated `setup.sh` and `deploy.sh` scripts.

You can find the updated structure and setup in use in [this website's
repository](https://github.com/Hjdskes/hjdskes.github.io). If any of the above
is unclear, feel free to send me an [email](mailto:hjdskes@gmail.com) and I'll
try my best to help you.

`setup.sh`:
```bash
#!/usr/bin/env bash

# This script does the required work to set up your personal GitHub Pages
# repository for deployment using Hugo. Run this script only once -- when the
# setup has been done, run the `deploy.sh` script to deploy changes and update
# your website. See
# https://hjdskes.github.io/blog/update-deploying-hugo-on-personal-github-pages/
# for more information.

# Name of the branch containing the Hugo source files.
SOURCE=hugo

msg() {
    printf "\033[1;32m :: %s\n\033[0m" "$1"
}

msg "Adding the \`public\` folder to .gitignore"
echo "public" >> .gitignore

msg "Deleting the \`master\` branch"
git branch -D master
git push origin --delete master

msg "Creating an empty, orphaned \`master\` branch"
git checkout --orphan master
git reset --hard
git commit --allow-empty -m "Initial commit on master branch"
git push origin master
git checkout $SOURCE

msg "Adding the master branch into the \`public\` folder"
rm -rf public
git worktree -B master public origin/master
```

`deploy.sh`
```bash
#!/usr/bin/env bash

# This script allows you to easily and quickly generate and deploy your website
# using Hugo to your personal GitHub Pages repository. This script requires a
# certain configuration, run the `setup.sh` script to configure this. See
# https://hjdskes.github.io/blog/update-deploying-hugo-on-personal-github-pages/
# for more information.

# Set the English locale for the `date` command.
export LC_TIME=en_US.UTF-8

# The commit message.
MESSAGE="Site rebuild $(date)"

msg() {
    printf "\033[1;32m :: %s\n\033[0m" "$1"
}

if [[ $(git status -s) ]]; then
    msg "The working directory is dirty, please commit or stash any pending changes"
    exit 1;
fi

msg "Removing the old website"
pushd public
git rm -rf *
popd

msg "Building the website"
hugo

msg "Pushing the updated \`public\` folder to the \`master\` branch"
pushd public
git add *
git commit -m "$MESSAGE"
popd
git push origin master
```
