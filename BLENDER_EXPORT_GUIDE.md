# 🎨 Blender to Three.js Export Guide

## Getting That Perfect Blender Look in Three.js

You're absolutely right - Blender looks much better! Here's how to export with outlines and studio lighting.

## Method 1: Freestyle Outlines (Recommended)

### Step 1: Enable Freestyle
1. Open your Blender file
2. Go to **Render Properties** (camera icon)
3. Scroll down to **Freestyle**
4. ✅ Check **Freestyle** checkbox

### Step 2: Configure Line Sets
1. In **Freestyle** section, you'll see **Line Sets**
2. Click the **+** to add a new line set
3. **Line Set 1 Settings:**
   - **Selection**: Object
   - **Edge Types**: ✅ Silhouette, ✅ Crease, ✅ Border
   - **Thickness**: 2-4 pixels
   - **Color**: Black (#000000)

### Step 3: Freestyle Modifiers (Optional)
- **Along Stroke** → **Color** → Set to desired outline color
- **Along Stroke** → **Thickness** → For variable line thickness

## Method 2: Solidify Modifier Outlines

### Step 1: Duplicate Objects for Outlines
1. Select all objects you want outlined
2. **Shift+D** to duplicate
3. **Esc** to cancel move (keeps in place)

### Step 2: Create Outline Material
1. Select duplicated objects
2. Add new material: **"Outline_Material"**
3. **Base Color**: Black or dark color
4. **Roughness**: 1.0 (no reflections)

### Step 3: Add Solidify Modifier
1. With outline objects selected
2. **Modifiers** → **Add Modifier** → **Solidify**
3. **Thickness**: 0.01-0.05 (adjust to taste)
4. ✅ **Flip Normals** (very important!)
5. ✅ **Even Thickness**

## Studio Lighting Setup: paint.sl

### Step 1: Enable Studio Light
1. In **3D Viewport**
2. **Shading**: Material Preview or Rendered
3. **Viewport Shading Options** (small down arrow)
4. **Studio Light**: Select **paint.sl**

### Step 2: World Lighting Setup
1. Go to **World Properties** (globe icon)
2. **Surface**: Use Shader Editor
3. **Add** → **Environment Texture**
4. **Open** → Find your **paint.sl** HDRI file
5. Connect **Color** to **Background Shader**

### Step 3: Bake Lighting (Advanced)
1. **UV Unwrap** all objects
2. **Create new image texture** for each object
3. **Bake** → **Combined** or **Diffuse**
4. This "burns in" the studio lighting

## GLB Export Settings

### Export Settings:
```
Format: glTF 2.0 (.glb)

Include:
✅ Limit to Selected Objects (if needed)
✅ Visible Objects
✅ Active Collection

Transform:
✅ +Y Up

Geometry:
✅ Apply Modifiers
✅ UVs
✅ Normals
✅ Tangents
✅ Vertex Colors (if used)

Materials:
✅ Export Materials
✅ Export Images

Animation: (Uncheck all if static model)
❌ Use Current Frame
❌ Animations
```

## Important Notes:

### For Freestyle Outlines:
- Freestyle creates **rendered** outlines, not geometry
- You need to **render** and **composite** them
- More complex but looks professional

### For Solidify Outlines:
- Creates actual **geometry** for outlines
- Exports directly to GLB
- Easier workflow, good results

### Studio Lighting:
- **paint.sl** is an HDRI environment
- Provides realistic reflections and lighting
- Can be "baked" into textures for web performance

## Recommended Workflow:

1. **Method 2 (Solidify)** for outlines - easier and exports well
2. **Studio Light** setup with proper materials
3. **Bake lighting** if you want consistent web performance
4. **Export with materials** enabled

This will give you that crisp, professional look you see in Blender! 🎨✨