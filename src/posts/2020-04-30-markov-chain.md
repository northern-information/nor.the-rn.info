---
title: Markov Chain
date: 2020-04-30
tags: ["Music Technology"]
---

![Markov Chains](/rm_ation/images/markov-chains.png)

[Sean Booth via an interview on Resident Advisor](https://www.residentadvisor.net/features/2756):

<!--x-->

> [...] but it might at least resemble the way a person thinks. It's funny, I've been reading about Markov models and Markov chains recently, the results from Markov Chains are remarkably similar to what you get out of Watson or DeepMind, these super advanced language modelling things. And this article was about how unwieldy that kind of mega-gigantic, expensive AI is, because you can actually achieve very close results using Markov chains, and they're really fucking simple, they're computationally really easy to deal with, they're what people use for Twitterbots and things like that. So in some ways these simple conditional responses can resemble very high-end AI. Even though it's very simple, the result is close enough not to matter.

I built a simple [Markov chain](https://en.wikipedia.org/wiki/Markov_chain) patch that I wanted to share. I'm going to extend this into delay units and sequencers.

I'm pretty happy with everything except the implementation of `if $i1 > $i2 then true else out2 true` forcing a `delay` to convert a true into a bang. I settled for this because `if` seemed to output to both outlets if I used the integer 1. And as far as I understand it, `if` cannot output bangs. There's probably a more elegant way to break the signal besides using 4 gates, too.

My favorite part of the patch is the use of sliders to intuitively control the probability. If both are set to zero, the bang will ping-pong back and forth between each chain. If set to 127, the bang will forever loop in on that side of the chain.

```max
----------begin_max5_patcher----------
1797.3oc2bszaiaCD9ryuBAidz0fOEo5gBTft2KPOVrXgrMii1UVxPRNMoK1
+6UjRJ9kD0rQzxw1GbBon8LebF9wYFxju+vjoKReQkO06279GuIS99CSlX5R
2wj51SltI7kkwg4lgMMQ8uoK95zYUOpP8Rgo63zvUKBSV27fjcahRhUElODd
emo6JNs2nUlugxu0ek42742FVr7onj0eISsrnR+jAr4nYd974R5AuD3Ydbo9
IDxbj2mq+BpDTwqaUUe5oFsy6y5m9iGdP+1rgA4LuLUtpnUDi.iXrEDiY9Zb
wDF3wn8Cx2G.2nxyCWqNCgQIKaEcDvniXCcH9AniDLmeYPWoVtPk0nHOllTj
Dtw7UN8OxhBi2qhYk8Wnx9hJIbQr5D6XetyjVfOseiKGaLq7JiK8.3q0z7n+
ynGlA00rxrg3bWZiWoV5n4f1bAX86BTOGPPl2Y1bAdrjno38gzE6JJRStfHk
CvYmJavXeH8iIeE0FHI9A217UTa6+PHx6b9Jprei68NeEMneWf6D9JD.m8ad
9JafjiH237U1hdj4iu24qH8abu64qn86BbevWQY.b1up7UKeJLJgrMKcQ3hn
3nhWGF2Ew1VQblIfRrfL+vrgoLZYmH+KEUlcricF1w13swxfOPXOGncucGcz
4XWXA5AUPmhQmWEDL5fxf3b7gcF9rEjsPhmK3iK.y7xUpUCyeEPteBggghL5
tmchNvVLa6yJIFbgCDmavXrAYutz6nfA.KD9bXck1dIe6fcSI1xviJLbKDQ0
VoAisi5xvXkGxCSDdTDp7WPnVQqOXz5acUI1fSLOnElFxEKYf3nmUyWcPbwO
Gl8V.y+8e8oO8m1b3wCJfYBAvDRPKLurJWBo0oiY6CerdL4gOqV8kvhhrnx0
xp8+Vd8DT8LjdRHdmJ8wlta5+vIgFQU6rezy1kDUjW7ZbmCHNMYcqyxGMp7m
RyJNYXUixXja9gyHl2NblYLDW713l43KydoEoqWGqFHMEB.MUI17O7kz+JPZ
sNrPMrb3w1hx2GeHkLkb6gNd+IscCiN.GtAQPtUQG0Z4foWSzkaimAL6I1F6
Y.mboHOyiiVsujYeKIcwxz3zrJ4Vt8qjP4j.FFK7YZwglGD3iDRFESEDNKP2
kV2NX918gGKAjmFwWLmiN3EWTpVRdcIGs6Nb.9yeJr5I761oSZ+o0+gX1rqp
UiFFahDvc6.iHsjs0kqx0cwsz8AO.lZQx..2VyYleYhKyAGlhzlKrOgeaeXJ
BqmlfjcmeXJB.F268CSQv52EXbNLkiitw8HkKAD4Sqrw.p8UTxG0iPR.XI9U
7HjVohCeUW2qAtWKg2ONoUdv9hqvUmzU3DK6O6xqINidz6Whvd+d46DuhmTI
dEY6Tdp3bkWozIll+DSAsURO.m+aqkJAGf.rE8LWePggIqR23g2WH52oGNfC
Ct0yGT.Hvj2M+0k1cWze4FtKVVC3Z3cmurN.Pgkt+VUCnbZtaQsYnSiiRN8O
.Biv08e7DQd5trkMea01Hu8BbkJuHJIrHpL.l8iQWgPO7aCZSzpsokZRsDwX
lIQBdaWjAhnim0gk6mQsw8o1zpAMHAoy3u2IHcdxdngJIJ.IIntPR.DjuCji
fMVHR.ZtyEVIcB1iij3PLS5h+NbIAPPt.QLPqkbgmGCDjHtPRP7wYtvGmAwG
m4D6DYzjDdzl8P.jD0I9d.DTfCjCExV2ToKjDDlHpSvj.B6pKV2R8GMLwGM6
DDWOpK1wfBgKh5D6DDtHpKXHn3QSRnQa1CxxIGHGBDtHB0VZDbdUZDHh9G9L
7asFptAg8RWrwt0MpTp0FZ00xtV2Ls1mpVl9za0E28xqr5JFBUY4XoEkEOBJ
q.txh8IVTV5Hnr9vUVhjaQYICSYgr6DwEL4DP6Nc71xtxWGhnIGum1ojFATi
Mv2bVOBJ57Vu8+ef8sb95.FT1uAasnPp6QfCp6AAxVGXqrl0S4D9I29bcggX
RZGOan5Mj3EHtHNeBjcwwA1beqITZcFxmH6bFxwqCQPM0uKfzsafyWGhfVLy
9ARaEyryBc578p.AD56EH566HTfLr8wvAPi8pSfTuNnIblZB+pMcGltIgW1K
qDb062PquEoG0BWc2mqccLsbsWOHbbRpgNh4.CIc8SpEmqPsXvAOTaTnUWk.
QUbBG2BWc.cMAOna474PHg5cR0qFUQaaJjPMmuCkW8GzImbdq53uZVAbIh+B
yglzzf4LXPy3YvRhBMcktMNh2xlRy1WapzsFptg.VhytOyv.4AI6WmIkKR1G
RMbNuvJUmhZ31sOqxxqGrQDS2D90p6fsbloYTRUSy49NMS8bTy3oldByV9TT
gZYwtrpK73K9UmG7zMok95I6hpc2KAWoHMGJs9xQluMrBGlyt9ge7v+CmKvM
0
-----------end_max5_patcher-----------
```
