export const LoadingSkeleton = () => {
  return (
    <div className="card animate-pulse">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-dark-surface rounded w-3/4"></div>
            <div className="h-4 bg-dark-surface rounded w-full"></div>
            <div className="h-4 bg-dark-surface rounded w-2/3"></div>
          </div>
          <div className="h-6 w-16 bg-dark-surface rounded-full"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-dark-surface rounded-lg p-3 border border-dark-border">
              <div className="h-3 bg-dark-hover rounded w-1/2 mb-2"></div>
              <div className="h-5 bg-dark-hover rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="h-12 bg-dark-surface rounded-lg"></div>
      </div>
    </div>
  );
};
