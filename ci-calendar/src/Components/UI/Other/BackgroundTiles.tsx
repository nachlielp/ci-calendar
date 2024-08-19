import React, { useEffect, useState } from "react";

const BackgroundTiles: React.FC = () => {
  const [tileCount, setTileCount] = useState(0);

  useEffect(() => {
    const calculateTiles = () => {
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      const tilesNeeded = Math.ceil(screenHeight / screenWidth) + 1; // Add one extra to cover scroll
      setTileCount(tilesNeeded);
    };

    calculateTiles();
    window.addEventListener("resize", calculateTiles);

    return () => window.removeEventListener("resize", calculateTiles);
  }, []);

  return (
    <div className="background-container">
      {[...Array(tileCount)].map((_, index) => (
        <div key={index} className="background-tile" />
      ))}
    </div>
  );
};

export default BackgroundTiles;
