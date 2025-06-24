import React from "react";
import { motion } from "framer-motion";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
  minItemWidth?: number;
  maxColumns?: number;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
}

const ResponsiveGrid = ({
  children,
  className = "",
  gap = "md",
  minItemWidth = 300,
  maxColumns = 4,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3
}: ResponsiveGridProps) => {
  const gapSizes = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6"
  };

  // Convert children to array
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className={`grid grid-cols-${mobileColumns} ${gapSizes[gap]}`}>
          {childrenArray.map((child, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="w-full"
            >
              {child}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden">
        <div className={`grid grid-cols-${tabletColumns} ${gapSizes[gap]}`}>
          {childrenArray.map((child, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="w-full"
            >
              {child}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className={`grid grid-cols-${desktopColumns} ${gapSizes[gap]}`}>
          {childrenArray.map((child, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="w-full"
            >
              {child}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveGrid; 