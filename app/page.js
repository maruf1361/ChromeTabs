// import TabCanvas from '@/components/canvas/TabCanvas';
// import Header from '@/components/layout/Header';
// import Sidebar from '@/components/layout/Sidebar';

// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col">
//       <Header />
//       <div className="flex flex-1">
//         <Sidebar />
//         <TabCanvas />
//       </div>
//     </main>
//   );
// }


import TabCanvas from '@/components/canvas/TabCanvas';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <TabCanvas />
    </main>
  );
}