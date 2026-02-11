---
title: Versions of Echo Vary in Fatally Incompatible Ways
date: 2023-02-27
---

I've been getting back to the basics lately. The following excerpt is from [opengroup.org](https://pubs.opengroup.org/onlinepubs/000095399/utilities/echo.html). `echo` is out. `printf` is in. I think I remember learning from my mentor, Stu, about 10 years ago...

But instead of integrating this somber fact, I invented all sorts of silly reasons to not adopt `printf` over `echo`. One less character. Easier to type. Sounds cooler. Is actually a word. I like delay pedals. Whatever. I wish I had gotten curious about my beliefs instead of rationalizing towards whatever I wanted to be true.

> **APPLICATION USAGE**
>
> It is not possible to use `echo` portably across all POSIX systems unless both `-n` (as the first argument) and escape sequences are omitted.
>
> The `printf` utility can be used portably to emulate any of the traditional behaviors of the `echo` utility as follows (assuming that IFS has its standard value or is unset):
>
> - The historic System V `echo` and the requirements on XSI implementations in this volume of IEEE Std 1003.1-2001 are equivalent to: `printf "%b\n" "$*"`
> - The BSD `echo` is equivalent to: `if [ "X$1" = "X-n" ] then shift printf "%s" "$*" else printf "%s\n" "$*" fi`
>
> New applications are encouraged to use `printf` instead of `echo`.
>
> **RATIONALE**
>
> The `echo` utility has not been made obsolescent because of its extremely widespread use in historical applications. Conforming applications that wish to do prompting without `<newline>`s or that could possibly be expecting to `echo` a `-n`, should use the `printf` utility derived from the Ninth Edition system.
>
> As specified, `echo` writes its arguments in the simplest of ways. The two different historical versions of `echo` vary in fatally incompatible ways.
>
> The BSD `echo` checks the first argument for the string `-n` which causes it to suppress the `<newline>` that would otherwise follow the final argument in the output.
>
> The System V `echo` does not support any options, but allows escape sequences within its operands, as described for XSI implementations in the OPERANDS section.
>
> The `echo` utility does not support Utility Syntax Guideline 10 because historical applications depend on `echo` to `echo` all of its arguments, except for the `-n` option in the BSD version.
