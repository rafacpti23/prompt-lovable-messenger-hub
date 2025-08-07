import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = "" }) => {
  return (
    <div className={`container mx-auto p-6 max-w-7xl ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;