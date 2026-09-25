export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="animate-blob-1 absolute -top-1/3 -left-1/4 h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(242,166,90,0.45),transparent_70%)] blur-3xl" />
      <div className="animate-blob-2 absolute top-1/4 -right-1/4 h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(79,209,197,0.35),transparent_70%)] blur-3xl" />
      <div className="animate-blob-3 absolute -bottom-1/3 left-1/4 h-[55vw] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(232,93,117,0.3),transparent_70%)] blur-3xl" />
    </div>
  );
}
