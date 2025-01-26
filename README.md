# Favemail

<img src="icons/favemail@2x.png" width="24">

This is a _personal_ browser extension to differentiate between tabs of multiple Google Mail accounts.

Feel free to fork.

## Goals

**Simple.** I'll just tweak the source if something needs changing. No setting pages.

**Works for me.** I don't need to see how many unread emails are waiting for me. I just need to know there are unread emails in my inbox.

**Works in Firefox.** I don't care about Chrome, Edge, Safari, Brave,...

## How it works

These are some examples of the document title in Google Mail, depending on what you're looking at:

```
Inbox (1) - name@yourdomain.com - Your Org Mail
"Labelname" - youraccount@gmail.com - Gmail
Subject of the email - name@yourdomain.com - Your Org Mail
```

The extension examines the last part to determine the account you're looking at. I've set up some fixed colors for both Gmail and my organization. Other accounts will have a (stable) color assigned using the name of the organization.

This color is applied to a custom SVG icon which is either:

1. a colorized "M", based on the original Google Mail logo, on a transparent background
2. a white "M" on a colorized background

A 3px border is applied to the top of the page in the same accent color.

The first version of the icon is the default. The second is used _if_ you've enabled the advanced "Unread message icon" setting in Google Mail _and_ you've got some unread messages in your inbox.

Whenever the favicon changes, the extension will use Google's favicon URL to determine whether there are any unread messages to select the proper version of the icon.
