export const BanCircle = () => {
  return (
    <svg className="h-6 w-6 text-red-500" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2"
         stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z"/>
      <circle cx="12" cy="12" r="9"/>
      <line x1="5.7" y1="5.7" x2="18.3" y2="18.3"/>
    </svg>
  );
};
