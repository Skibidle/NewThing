# Primal Hunter — Mini Web Demo

This is a small single-file web demo inspired by a Primal Hunter–style LitRPG. It demonstrates:

- Floating "System" UI with Level, Class, XP, and stat distribution (Strength, Dexterity, Perception, Mana, Vitality).
- Mana-based abilities (Mana Bolt, Shade Step) and passive Hunter's Focus.
- Enemies (Hydra-Serpent, Shadow Panther, Eldritch Wolf, Insectoid Horror) and loot drops.
- Leveling and stat allocation (open Level Up modal with `L`).
- No timers, countdowns, or cooldown HUDs are shown anywhere in the UI.

How to run
1. Open `index.html` in a modern browser (Chrome, Firefox, Edge).
2. Or run a simple local server from the project root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Controls
- Click anywhere to cast Mana Bolt (costs mana).
- Press `E` to Shade Step (dash, costs mana).
- Click "Explore" to spawn enemies and hunt.
- Click "Camp" to rest and get a crafting hint.
- Press `L` to open the Level Up modal after you gain enough XP.

Notes
- This is a demo/prototype to show the core LitRPG elements without any timing UI. It is intentionally compact and easily extensible to add more systems like skill trees, class branches, dungeons, and persistent progression.
