export default function Preview() {
  return (
    <div className="min-h-[calc(100vh-48px)] px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">UI Preview</h1>
      <p className="text-sm opacity-80 mb-6">Use the toggle in the nav to switch Light/Dark.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Dashboard Mock */}
        <section className="border rounded-md p-4 bg-white/60 dark:bg-white/5">
          <h2 className="text-lg font-medium mb-3">Customer</h2>
          <div className="space-y-3">
            <div className="p-3 rounded border">
              <div className="text-sm opacity-80">Wallet Balance</div>
              <div className="text-2xl font-semibold">₦24,800</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded border">
                <div className="text-sm opacity-80">Digital Card</div>
                <div className="text-xs opacity-60">**** 4821</div>
              </div>
              <div className="p-3 rounded border">
                <div className="text-sm opacity-80">Streak</div>
                <div className="text-xl font-semibold">5 days</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 h-9 rounded border">₦200</button>
              <button className="px-3 h-9 rounded border">₦500</button>
              <button className="px-3 h-9 rounded border">₦1,000</button>
            </div>
            <button className="w-full h-10 rounded bg-foreground text-background">Mark Today</button>
            <button className="w-full h-9 rounded border">Join Cluster</button>
          </div>
        </section>

        {/* Agent Dashboard Mock */}
        <section className="border rounded-md p-4 bg-white/60 dark:bg-white/5">
          <h2 className="text-lg font-medium mb-3">Agent</h2>
          <div className="space-y-3">
            <div className="p-3 rounded border">
              <div className="text-sm font-medium">Approvals Queue</div>
              <ul className="text-sm mt-2 space-y-1">
                <li className="flex justify-between"><span>Uche – ₦1,000</span><button className="text-xs border rounded px-2">Approve</button></li>
                <li className="flex justify-between"><span>Bola – ₦500</span><button className="text-xs border rounded px-2">Approve</button></li>
              </ul>
            </div>
            <div className="p-3 rounded border">
              <div className="text-sm font-medium">Customers</div>
              <ul className="text-sm mt-2 space-y-1">
                <li>ade@mail.com</li>
                <li>joan@mail.com</li>
                <li>chidi@mail.com</li>
              </ul>
            </div>
            <div className="p-3 rounded border">
              <div className="text-sm font-medium">Commission Summary</div>
              <div className="text-xl font-semibold">₦6,200</div>
              <table className="w-full mt-2 text-xs">
                <thead className="opacity-70">
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2025-08-22</td>
                    <td>₦2,100</td>
                  </tr>
                  <tr>
                    <td>2025-08-23</td>
                    <td>₦1,400</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Admin Snapshot Mock */}
        <section className="border rounded-md p-4 bg-white/60 dark:bg-white/5">
          <h2 className="text-lg font-medium mb-3">Admin</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Total Collected</div>
              <div className="text-xl font-semibold">₦1.2m</div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs opacity-70">Today</div>
              <div className="text-xl font-semibold">₦84,000</div>
            </div>
            <div className="p-3 rounded border col-span-2">
              <div className="text-xs opacity-70">Active Cluster</div>
              <div className="text-sm">Ikeja North</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
