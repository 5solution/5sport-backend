## Feature: stage

In the 5Sport system, an "Event" is merely the outer shell (think of it like a circus tent), while the "Session" is where the actual action happens. Each category functions as a completely independent "sub-tournament" with its own specific rules, participant counts, and scoring logic.

I’ll simulate the 4 tickets you mentioned to show you how flexible this setup is:

REAL-WORLD CONFIGURATION EXAMPLE ON 5SPORT
Let’s assume the tournament name is: "5Arena Pickleball Open 2026".

Would you like me to continue with the specific breakdown of those 4 ticket types based on this logic?

Stage is child of session
type of stage:

- Double Elimination
- Round Robin + Playoff
- Single Elimination
- Flex Tournament

made it flexible (can use strategy pattern)

Round Robin + Playoffs
Icon: Grid Table

Description: Divide into groups for round-robin play; top seeds advance to the finals.

Pro-tip: Recommended for N > 5.

Single Elimination
Icon: Bracket Diagram

Description: Lose one match and you're out.

Double Elimination
Icon: Dual Brackets

Description: Features both Winners and Losers brackets (second-chance system).

Custom (Flex)
Manual Seeding: Manually arrange and set up the matches yourself.

## Other feature

- create API random: user (create multiple user as bot)
- create API for register a event (register in session for have view to see how it run)
