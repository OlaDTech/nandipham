import { useState } from 'react'
import { Search, Package, ShoppingBag, ShoppingCart, QrCode, ArrowUpRight, ArrowRight, MessageCircle, Wallet, ReceiptText, Warehouse } from 'lucide-react'
import { formatMoney, StatusPill, fmtAgo, SkeletonList } from './UI'

export default function ClientHome({client,goods,announcements,unread,wallet,walletLoading,loading,navigate,showLabel,selectGoods}) {
 const [query,setQuery]=useState('')
 const matches=goods.filter(g=>[g.description,g.tracking_no].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase()))).slice(0,5)
 const balance=wallet?.balances?.find(b=>b.currency==='BWP')?.available_balance
 return <div className="nm-client">
  <header className="nm-page-heading"><div><span className="nm-eyebrow">YOUR PERSONAL SHIPPING DESK</span><h1>Welcome back, {client.full_name?.split(' ')[0]}.</h1><p>A little closer to your next delivery.</p></div><button className="nm-outline" onClick={()=>navigate('chat')}><MessageCircle size={18}/> Contact the team{unread>0&&<b>{unread}</b>}</button></header>
  <div className="nm-client-grid">
   <main>
    <section className="nm-shopping-feature"><span className="nm-eyebrow">THE NANDIPHAM EDIT</span><h2>Good finds.<br/><em>Great possibilities.</em></h2><p>Browse the store or send us a product link. Keep your purchases and shipping together.</p><div className="nm-actions"><button className="btn btn-primary" onClick={()=>navigate('store')}>Explore the store <ArrowUpRight size={16}/></button><button className="nm-text-button" onClick={()=>navigate('purchase')}>Buy for me <ArrowRight size={16}/></button></div><ShoppingBag className="nm-feature-bag" size={110} strokeWidth={.8} aria-hidden="true"/></section>
    <section className="nm-section"><div className="nm-section-title"><h2>Your packages</h2><button onClick={()=>navigate('goods')}>View all <ArrowRight size={15}/></button></div><label className="nm-search"><Search size={17}/><input aria-label="Search services or packages" placeholder="Search packages or tracking numbers" value={query} onChange={e=>setQuery(e.target.value)}/></label>
     {loading?<SkeletonList n={2}/>:matches.length?matches.map(g=><button className="nm-package-row" key={g.id} onClick={()=>selectGoods(g)}><span className="nm-small-icon"><Package size={21}/></span><span><strong>{g.description}</strong><small>{g.tracking_no || 'View package details'}</small></span><StatusPill status={g.status}/><ArrowUpRight size={16}/></button>):<div className="nm-empty"><Package size={28}/><h3>{query?'No matching packages':'Your deliveries start here'}</h3><p>{query?'Try a description or tracking number.':'Share your shipping label with your supplier. Received goods will appear here.'}</p><button className="nm-text-button" onClick={showLabel}>View shipping label <ArrowRight size={16}/></button></div>}
    </section>
    <section className="nm-section"><div className="nm-section-title"><h2>From the team</h2><MessageCircle size={18}/></div>{announcements.length?announcements.slice(0,3).map(a=><article className="nm-update" key={a.id}><small>{fmtAgo(a.created_at)}</small><h3>{a.title}</h3><p>{a.body}</p></article>):<p className="nm-muted">No announcements right now. You’re all caught up.</p>}</section>
   </main>
   <aside className="nm-client-aside">
    <section className="nm-label-ticket"><span className="nm-eyebrow">YOUR SHIPPING IDENTITY</span><QrCode size={40}/><strong>{client.shipping_mark}</strong><p>One mark for every package.<br/>Share it with your supplier.</p><button onClick={showLabel}>Download my label <ArrowUpRight size={17}/></button></section>
    <section className="nm-balance"><Wallet size={21}/><span>Available balance</span><strong>{walletLoading?'Loading…':balance===undefined?'View balance':formatMoney(balance,'BWP')}</strong><button className="nm-text-button" onClick={()=>navigate('wallet')}>Manage wallet <ArrowRight size={16}/></button></section>
    <nav className="nm-shortcuts" aria-label="Client shortcuts">{[{label:'Receipts & payments',icon:ReceiptText,tab:'receipts'},{label:'Supplier directory',icon:Warehouse,tab:'suppliers'},{label:'Account & security',icon:QrCode,tab:'account'}].map(s=><button key={s.tab} onClick={()=>navigate(s.tab)}><s.icon size={18}/>{s.label}<ArrowUpRight size={15}/></button>)}</nav>
   </aside>
  </div>
 </div>
}
