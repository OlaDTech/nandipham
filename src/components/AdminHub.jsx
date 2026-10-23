import { useState } from 'react'
import { Search, Package, Users, Ship, Wallet, Barcode, ShoppingBag, ShoppingCart, ReceiptText, Settings, MessageCircle, Plus, Bell, ArrowRight } from 'lucide-react'
import '../styles/client-home.css'
import '../styles/admin-hub.css'

export default function AdminHub({ profile, isAdmin, can, navigate, recordGoods, addClient, openReceipts, unread, loading, children }) {
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState('Everyday')
  const services=[
    {label:'Warehouse',Icon:Package,tab:'goods',permission:'goods',group:'Operations',tone:'blue'},
    {label:'Customers',Icon:Users,tab:'clients',permission:'clients',group:'Operations',tone:'green'},
    {label:'Shipments',Icon:Ship,tab:'containers',permission:can('containers')?'containers':'goods',group:'Operations',tone:'orange'},
    {label:'Tracking',Icon:Barcode,tab:'tracking',permission:'scan',group:'Operations',tone:'violet'},
    {label:'Storefront',Icon:ShoppingBag,tab:'store',admin:true,group:'Business',tone:'green'},
    {label:'Buy for clients',Icon:ShoppingCart,tab:'purchases',permission:'purchases',group:'Business',tone:'orange'},
    {label:'Receipts',Icon:ReceiptText,action:openReceipts,permission:can('finance')?'finance':'receipts',group:'Business',tone:'violet'},
    {label:'Finance',Icon:Wallet,tab:'finance',permission:'finance',group:'Business',tone:'green'},
    {label:'Client balances',Icon:Wallet,tab:'wallet',permission:'finance',group:'Business',tone:'blue'},
    {label:'Messages',Icon:MessageCircle,tab:'messages',permission:'messages',group:'Manage',tone:'green'},
    {label:'Team & roles',Icon:Users,admin:true,action:()=>{const panel=document.getElementById('admin-team-panel');if(panel){panel.open=true;panel.scrollIntoView({block:'start',behavior:'smooth'})}},group:'Manage',tone:'violet'},
    {label:'Settings',Icon:Settings,tab:'settings',admin:true,group:'Manage',tone:'orange'},
  ].filter(s=>s.admin?isAdmin:can(s.permission))
  const quick=[
    can('goods') && {label:'Record goods',Icon:Plus,action:recordGoods},
    can('clients') && {label:'Add client',Icon:Users,action:addClient},
    (can('receipts')||can('finance')) && {label:'Receipts',Icon:ReceiptText,action:openReceipts},
    can('scan') && {label:'Track goods',Icon:Barcode,action:()=>navigate('tracking')},
  ].filter(Boolean)
  const visible=services.filter(s=>(query || category==='Everyday' || s.group===category) && (!query || s.label.toLowerCase().includes(query.toLowerCase())))
  return <div className="nm-admin admin-hub-home">
    <header className="nm-page-heading"><div><span className="nm-eyebrow">NANDIPHAM / WORKSPACE</span><h1>Your business, thoughtfully organised.</h1><p>Welcome, {profile?.full_name?.split(' ')[0] || 'team'}. What needs your attention today?</p></div></header>
    <div className="nm-admin-actions">{quick.map(s=><button key={s.label} onClick={s.action}><s.Icon size={18}/>{s.label}<ArrowRight size={15}/></button>)}</div>
    <div className="nm-admin-workbench">
      <section className="nm-toolbox" aria-label="Admin services"><label className="nm-search"><Search size={17}/><input aria-label="Search admin tools" placeholder="Find a workspace tool" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Clear admin search" onClick={()=>setQuery('')}>×</button>}</label><div className="nm-tool-categories">{['Everyday','Operations','Business','Manage'].map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c==='Everyday'?'All tools':c}</button>)}</div><div className="nm-tool-list">{visible.map(s=><button key={s.label} onClick={s.action || (()=>navigate(s.tab))}><s.Icon size={19}/><span>{s.label}<small>{s.group}</small></span><ArrowRight size={15}/></button>)}</div>{!visible.length&&<p className="nm-muted">No tools match your search.</p>}</section>
      <section className="nm-operations">
        {can('messages')&&<button className="nm-inbox hub-notifications" onClick={()=>navigate('messages')}><MessageCircle size={23}/><span><strong>{unread?`${unread} unread client messages`:'Your client conversations'}</strong><small>Personal service starts with a conversation.</small></span><ArrowRight size={18}/></button>}
        <div className="nm-section-title"><h2>Operations overview</h2><span>{loading?'Updating…':'Warehouse & shipping'}</span></div>
        {children}
      </section>
    </div>
  </div>
}
