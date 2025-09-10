# ALAIN GIF Thumbnail - Implementation Storyboard

## **Quick Implementation Guide** (4:3 ratio, ~4 seconds)

---

## **Frame 1: The Problem** (1.2s)
### Visual Mockup:
```
┌─────────────────────────────────────┐
│                                     │
│    😵‍💫  New AI Model Released         │
│                                     │
│  ███████████ ████████ ███████       │
│  ██████ ███ ████████████████        │  
│  ████████ ██████ ███████████        │
│  ███ ████████ ██████████            │
│                                     │
│    "How do I actually use this?"    │
│                                     │
└─────────────────────────────────────┘
```

### **Implementation**:
- **Background**: Light gray (#F5F5F5)
- **Text blocks**: Dark gray rectangles (representing dense documentation)
- **Emoji**: Confused face emoji
- **Bottom text**: Clean sans-serif, 20pt
- **Animation**: Text blocks randomly fade in/out (overwhelming effect)

---

## **Frame 2: The Solution** (1s)
### Visual Mockup:
```
┌─────────────────────────────────────┐
│                                     │
│             🔧 ALAIN                │
│                                     │
│   paste URL → get instructions      │
│                                     │
│    [https://huggingface.co/...]     │
│              ↓                      │
│         ✨ Generating ✨             │
│                                     │
└─────────────────────────────────────┘
```

### **Implementation**:
- **Background**: Clean white
- **ALAIN logo**: IKEA blue (#0058A3)
- **URL box**: Light border, realistic input field
- **Sparkles**: Small animated dots around "Generating"
- **Animation**: URL types in character by character, sparkles pulse

---

## **Frame 3: The Magic** (1s)  
### Visual Mockup:
```
┌─────────────────────────────────────┐
│                                     │
│      📋 Step-by-Step Guide          │
│                                     │
│      1. ✓ Setup & Keys              │
│      2. ✓ First API Call            │
│      3. ✓ Run Live Example          │
│      4. ✓ Cost Analysis             │
│                                     │
│        Clear • Safe • Ready        │
│                                     │
└─────────────────────────────────────┘
```

### **Implementation**:
- **Background**: IKEA blue header, white body
- **Checkmarks**: Green (#00B050), animate in sequence
- **Steps**: Clean list format, easy to read
- **Bottom tagline**: Bold, small caps
- **Animation**: Checkmarks appear 0.2s apart

---

## **Frame 4: The Result** (0.8s hold)
### Visual Mockup:
```
┌─────────────────────────────────────┐
│                                     │
│    ⚡ Working Code in 2 Minutes     │
│                                     │
│    💰 Cost: $0.03  ⏱️ Time: 45s     │
│                                     │
│    From confusion to competence     │
│                                     │
│         ALAIN.dev                   │
│                                     │
└─────────────────────────────────────┘
```

### **Implementation**:
- **Background**: Success gradient (light green to white)
- **Metrics**: Bold numbers, icon + text pairs
- **Tagline**: Italicized, elegant font
- **URL**: Small, bottom right corner
- **Animation**: Metrics count up from 0

---

## **Quick Creation Tools**

### **Option 1: Canva Pro** (Fastest - 30 minutes)
1. Create 1024x768 design
2. Use text animations and transitions
3. Export as MP4, convert to GIF
4. Built-in IKEA color palette available

### **Option 2: Figma + FigJam** (Medium - 1 hour)
1. Design static frames in Figma
2. Use Smart Animate for transitions
3. Export frames, compile in After Effects
4. More control over exact positioning

### **Option 3: Screen Recording** (Authentic - 45 minutes)
1. Create a demo flow in your actual app
2. Record with clean, slow movements
3. Edit to 4 seconds with title cards
4. Most authentic but requires working demo

### **Option 4: After Effects** (Professional - 2-3 hours)
1. Full motion graphics control
2. Perfect timing and easing
3. Export optimized GIF
4. Highest quality result

---

## **Recommended: Hybrid Approach**

### **Step 1**: Create static mockups in Figma (15 min)
- Design all 4 frames with exact text and colors
- Use IKEA style guide for consistency
- Export high-res PNGs

### **Step 2**: Animate in Canva Pro (15 min)
- Import Figma frames as starting points
- Add simple transitions between frames
- Use built-in text animations for key elements

### **Step 3**: Polish and export (10 min)
- Fine-tune timing (1.2s, 1s, 1s, 0.8s)
- Add smooth transitions
- Export as high-quality GIF

**Total time: 40 minutes**

---

## **Technical Specs for Devpost**

### **Requirements**:
- **Size**: 1024x768 (4:3) or 800x600
- **Duration**: 3-5 seconds ideal
- **File Size**: Under 5MB
- **Format**: GIF or MP4
- **Loop**: Seamless infinite loop

### **Export Settings**:
- **Frame Rate**: 15 FPS (smooth but not too large)
- **Colors**: 256 color palette (GIF limitation)
- **Compression**: Optimize for web
- **Dithering**: Light dithering for smooth gradients

---

## **Fallback Static Design**

If GIF proves too complex, create a powerful static thumbnail:

```
┌─────────────────────────────────────┐
│  Raw AI Models    →    Clear Steps  │
│                                     │
│      🤔              📋             │
│   Confusing       Step-by-Step      │
│  Documentation    Instructions      │
│                                     │
│               ALAIN                 │
│    Assembly Instructions for AI     │
└─────────────────────────────────────┘
```

Split-screen before/after with strong visual contrast.

---

## **Brand Consistency Checklist**

- [ ] IKEA blue (#0058A3) as primary color
- [ ] Clean, sans-serif typography (Inter or Roboto)
- [ ] Generous whitespace
- [ ] Simple, universal icons
- [ ] Clear hierarchy (largest text for main message)
- [ ] Consistent with "assembly instructions" theme

The goal: Anyone scrolling Devpost immediately thinks **"Oh, this makes confusing AI models into clear instructions!"**
