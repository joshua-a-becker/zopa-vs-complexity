# Demo Negotiation Session Summary

## What We Were Working On

We were debugging and improving the Demo Negotiation component that guides users through a practice negotiation before the real game.

## Current State

### Demo Flow - WORKING ✅
The demo is now fully functional with the following flow:

1. **Initial modal** → "This is a demo. **Start** by making a proposal..."
2. **User submits 1st proposal** → Computers vote (1 accept, 1 reject) → "Proposal Submitted" modal
3. **User votes on 1st proposal** → Proposal fails → "Try Modifying" modal
4. **User clicks Modify button** → Calculator pre-fills with that proposal's options
5. **User submits 2nd (modified) proposal** → Computers vote → "Modified Proposal Submitted" modal
6. **User votes on 2nd proposal** → Proposal fails → Computer generates new proposal (flipping Kitchen_Storage)
7. **"New Proposal" modal appears** → Computer proposal (from "Player A") with 2/2 computer accepts
8. **User votes Accept** → 3/3 unanimous → Finalize modal appears
9. **User votes Finalize** → Computers finalize → "Demo Complete" modal → proceeds to waiting room

### Recent Bug Investigation - RESOLVED ✅

**Issue:** User reported that voting "Reject" on the 2nd proposal wasn't working.

**Reality:** It WAS working! The confusion was caused by a UX problem:
- When user rejects 2nd proposal, it correctly fails (1/3 accepted)
- Computer proposal immediately appears
- The computer proposal looks IDENTICAL to the user's proposal except:
  - Tiny "Submitted by: Player A" text (easy to miss)
  - Different checkboxes (but user can't see old vs new instantly)
- Transition happens instantly with no visual indication of change
- User thought they were still looking at their own proposal

### Debug Logging Added (Can be removed)

Added console.log statements in:
- `Demo.jsx` lines 126, 142, 147, 157, 167, 171, 203
- `DemoMaterialsPanel.jsx` lines 156, 159, 169, 171

These can be removed once UX fix is implemented.

## The Real Problem: Proposal Ownership Not Obvious

### Current Design
When viewing a pending proposal, the only indicator of who submitted it is:
```jsx
<span className="text-sm text-gray-500">Submitted by: {name}</span>
```
This is:
- Small font (text-sm)
- Gray color (easy to miss)
- In the top-right corner
- Identical layout whether it's your proposal or someone else's

### Proposed Solution

Replace the tiny "Submitted by" text with large, colored badges:

**Your Own Proposals:**
```jsx
<span className="px-4 py-2 bg-blue-100 text-blue-700 font-bold text-lg rounded">
  YOUR PROPOSAL
</span>
```
- Blue background (matches player's score theme)
- Large, bold text
- Impossible to miss

**Others' Proposals:**
```jsx
<span className="px-4 py-2 bg-amber-100 text-amber-700 font-bold text-lg rounded">
  SUBMITTED BY: {submittedByName}
</span>
```
- Amber/orange background (warm color, indicates attention needed)
- Large, bold text
- Clear attribution

## Files to Modify

### 1. `/client/src/intro-exit/DemoMaterialsPanel.jsx`
- **Line ~445-453**: Current Proposal header
- Change: Replace tiny "Submitted by" with large colored badge
- Logic: `pendingProposal.submittedBy === player.id` ? "YOUR PROPOSAL" (blue) : "SUBMITTED BY: [name]" (amber)

### 2. `/client/src/components/MaterialsPanel.jsx`
- **Similar location**: Current Proposal header in real game component
- Same change as DemoMaterialsPanel
- This ensures consistency between demo and real game

## Detailed Plan

A comprehensive plan exists at: `/Users/joshuabecker/.claude/plans/silly-petting-hippo.md`

The plan includes:
- Problem description
- Solution design with color rationale
- Exact code changes with examples
- Verification steps for both demo and real game
- Edge cases to consider
- Optional enhancements (animations)

## Next Steps

1. **Remove debug logging** (optional cleanup):
   - Remove console.log statements from Demo.jsx and DemoMaterialsPanel.jsx

2. **Implement UX fix** (main task):
   - Modify DemoMaterialsPanel.jsx to add colored badges
   - Modify MaterialsPanel.jsx to add colored badges
   - Test in demo to verify "YOUR PROPOSAL" vs "SUBMITTED BY: Player A" is obvious
   - Test in real game to verify consistency

3. **Optional enhancement**:
   - Add fade-in animation when proposal changes
   - Makes transition more noticeable

## Files Reference

- **Demo orchestrator**: `/client/src/intro-exit/Demo.jsx`
- **Demo UI**: `/client/src/intro-exit/DemoMaterialsPanel.jsx`
- **Demo content**: `/client/src/intro-exit/demoContent.js`
- **Real game UI**: `/client/src/components/MaterialsPanel.jsx`
- **App integration**: `/client/src/App.jsx`

## Key Demo Settings

- Uses `intro_` prefix for all player state (e.g., `intro_proposalHistory`, `intro_demoState`)
- Simulates 3 players: user + computer_1 + computer_2
- Computer votes are predetermined for scripted flow
- State persists across page refresh
- Shown even with skipIntro=T parameter

## Scenario

Uses "Roommate Agreement" theme with 8 issues:
- Pets_Allowed (+15 pts)
- Overnight_Guests (+12 pts)
- Clean_Ourselves (+10 pts)
- Kitchen_Storage (+8 pts) ← This is the one that gets flipped for computer proposal
- Late_Nights_OK (+7 pts)
- Cooler_Winter_Temp (+5 pts)
- Shared_Groceries (+4 pts)
- Living_Room_Style (+3 pts)

All positive scores when checked (no negative values that confused users earlier).
