import React, { useEffect, useRef } from 'react'
import GUI from 'lil-gui'

const GUIComponent = ({
  backgroundColor,
  setBackgroundColor,
  ambientIntensity,
  setAmbientIntensity,
  directionalIntensity,
  setDirectionalIntensity,
  tableColor,
  setTableColor,
  etgColor,
  setEtgColor,
  specialObjectsColor,
  setSpecialObjectsColor
}) => {
  const guiRef = useRef()

  useEffect(() => {
    // Create GUI
    const gui = new GUI()
    gui.domElement.style.position = 'fixed'
    gui.domElement.style.top = '120px'
    gui.domElement.style.right = '15px'
    gui.domElement.style.zIndex = '999'
    guiRef.current = gui

    // Background color control
    gui.addColor({ backgroundColor }, 'backgroundColor')
       .onChange((value) => setBackgroundColor(value))

    // Ambient light intensity
    gui.add({ ambientIntensity }, 'ambientIntensity', 0, 3, 0.1)
       .onChange((value) => setAmbientIntensity(value))

    // Directional light intensity
    gui.add({ directionalIntensity }, 'directionalIntensity', 0, 5, 0.1)
       .onChange((value) => setDirectionalIntensity(value))

    // Table color control
    gui.addColor({ tableColor }, 'tableColor')
       .name('Table Color')
       .onChange((value) => setTableColor(value))

    // eTG color control
    gui.addColor({ etgColor }, 'etgColor')
       .name('eTG Color')
       .onChange((value) => setEtgColor(value))

    // Special objects color control
    gui.addColor({ specialObjectsColor }, 'specialObjectsColor')
       .name('Special Objects Color')
       .onChange((value) => setSpecialObjectsColor(value))

    // Cleanup
    return () => {
      if (guiRef.current) {
        guiRef.current.destroy()
      }
    }
  }, [])

  // Update GUI values when props change
  useEffect(() => {
    if (guiRef.current) {
      guiRef.current.controllers.forEach(controller => {
        if (controller.property === 'backgroundColor') {
          controller.object.backgroundColor = backgroundColor
          controller.updateDisplay()
        } else if (controller.property === 'ambientIntensity') {
          controller.object.ambientIntensity = ambientIntensity
          controller.updateDisplay()
        } else if (controller.property === 'directionalIntensity') {
          controller.object.directionalIntensity = directionalIntensity
          controller.updateDisplay()
        } else if (controller.property === 'tableColor') {
          controller.object.tableColor = tableColor
          controller.updateDisplay()
        } else if (controller.property === 'etgColor') {
          controller.object.etgColor = etgColor
          controller.updateDisplay()
        } else if (controller.property === 'specialObjectsColor') {
          controller.object.specialObjectsColor = specialObjectsColor
          controller.updateDisplay()
        }
      })
    }
  }, [backgroundColor, ambientIntensity, directionalIntensity, tableColor, etgColor, specialObjectsColor])

  return null
}

export default GUIComponent