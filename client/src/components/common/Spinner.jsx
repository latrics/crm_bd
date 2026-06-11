export default function Spinner() {
  return (
    <div className="flex justify-center items-center p-10">
      <div className="w-8 h-8 border-4 border-brand-bg border-t-brand-red rounded-full animate-[spin_1s_linear_infinite]"></div>
    </div>
  );
}
