import React from 'react'

const Lighting = ({ ambientIntensity, directionalIntensity }) => {
  return (
    <>
      {/* Ambient light for overall brightness */}
      <ambientLight intensity={ambientIntensity} color={0xffffff} />
      
      {/* Main directional light */}
      <directionalLight
        intensity={directionalIntensity}
        color={0xffffff}
        position={[25, 30, 25]}
        castShadow={false}
      />
      
      {/* Fill light from the right to brighten dark areas */}
      <directionalLight
        intensity={directionalIntensity * 0.4}
        color={0xffffff}
        position={[-25, 20, 15]}
        castShadow={false}
      />
      
      {/* Back light for even coverage */}
      <directionalLight
        intensity={directionalIntensity * 0.3}
        color={0xffffff}
        position={[0, 25, -30]}
        castShadow={false}
      />
    </>
  )
}

export default Lighting