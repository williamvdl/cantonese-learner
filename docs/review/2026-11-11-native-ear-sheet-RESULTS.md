# Native-ear review sheet — results

*Marked 2026-11-12 by a fluent Cantonese speaker, by ear, on the tappable
version of the sheet. All 28 lines marked. Read against the rules written in
`2026-11-11-native-ear-sheet-KEY.md` before any marks existed.*

## The count

| Group | Lines | Marked Off | Reading, by the key's rules |
|---|---|---|---|
| Control — drawn at random | 14 | 0 | The baseline is clean |
| 好的 (hou2 dik1) | 2 | 2 | **Stays on the register list** |
| 想要 (soeng2 jiu3) | 4 | 0 | **Comes off the list** |
| 嗎 (maa3), other than the greeting | 6 | 1 | **Comes off the list** |
| 你好嗎？ (nei5 hou2 maa3?) | 2 | 0 | Fine, as expected of a set greeting |

## What it shows

- **The scan was too strict.** 3 of its 14 flagged lines were confirmed. Two of
  its three markers were wrong: 想要 (soeng2 jiu3) and a question ending in 嗎
  (maa3) are both acceptable to a native ear in these lessons. They were put on
  the list from an expectation of what "written-style" Cantonese looks like,
  not from evidence — and that expectation was an AI's. It is a direct
  measurement of how far an AI's judgement of naturalness can be trusted
  without calibration: about one flag in five.
- **One marker earned its place.** 好的 (hou2 dik1) was marked Off both times,
  and replaced with 好呀 (hou2 aa3) both times. Two lines is thin, but it agrees
  with the spoken corpus, which has no instance of it
  (`PROPOSAL-content-playbook.md` §1).
- **The unflagged corpus looks sound, within what 14 lines can show.** None of
  the 14 random lines was marked. That does not put the corpus's error rate at
  zero — a sample of 14 with no misses is still consistent with a real rate of
  up to about one line in five — but it gives no sign of a wider problem, so
  the key's "take a wider sample" step is not triggered.
- **One line outside any pattern.** The tag question 好嗎？ (hou2 maa3?) on the
  end of a suggestion was marked Off, where 嗎 (maa3) on a plain question was
  fine five times. A single instance: logged, not made a rule.

## The corrections — the first entries in the known-bad set

| Sheet # | Lesson | Before | After, as given by the reviewer |
|---|---|---|---|
| 10 | Days & Time, chat line 4 | 朝早十點見，好嗎？ (ziu1 zou2 sap6 dim2 gin3, hou2 maa3?) | 得唔得朝早十點見？ (dak1 m4 dak1 ziu1 zou2 sap6 dim2 gin3?) |
| 13 | Days & Time, chat line 6 | 好的！聽日朝早見！ (hou2 dik1! ting1 jat6 ziu1 zou2 gin3!) | 好呀！聽日朝早見！ (hou2 aa3! ting1 jat6 ziu1 zou2 gin3!) |
| 14 | Numbers, chat line 6 | 好的，多謝！ (hou2 dik1, do1 ze6!) | 好呀，多謝！ (hou2 aa3, do1 ze6!) |

The reviewer gave each correction in jyutping; the characters in the *After*
column are written from it and want a glance before they go into the data.

**Fixed in the data at v167** (2026-11-12): each line, its jyutping, its
breakdown and its first Fill-the-Gap option. The audio for the three lines is
regenerated separately — see STATUS.md's v167 row.

## What changes because of this

- The register list for the proposed scan (`PROPOSAL-content-playbook.md` §4,
  H7) keeps 好的 (hou2 dik1) and drops 想要 (soeng2 jiu3) and 嗎 (maa3).
- The retrofit and all new content: 好呀 (hou2 aa3), not 好的 (hou2 dik1), for
  an agreeing reply.
- The known-bad set for calibrating an AI reviewer now holds 8 lines: these
  three, and the five recovered from the repo's history.
