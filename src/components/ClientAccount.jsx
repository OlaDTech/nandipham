import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { updateClientAccount } from '../lib/supabase'

export default function ClientAccount() {
  const { clientUser, clientSessionToken, updateClientProfile } = useAuth()
  const [form,setForm] = useState({ full_name:clientUser.full_name || '',phone:clientUser.phone || '',country:clientUser.country || '',state:clientUser.state || '',current_password:'',new_password:'',confirmation:'' })
  const [busy,setBusy]=useState(false), [error,setError]=useState(''), [success,setSuccess]=useState('')
  const change = e => { setForm(current=>({...current,[e.target.name]:e.target.value}));setSuccess('');setError('') }
  async function save(e) {
    e.preventDefault()
    if (busy) return
    setError('');setSuccess('')
    if(form.new_password!==form.confirmation){setError('New passwords do not match.');return}
    if(form.new_password && (form.new_password.length<10 || new TextEncoder().encode(form.new_password).length>72)){setError('Use at least 10 characters and no more than 72 UTF-8 bytes for your new password.');return}
    setBusy(true)
    try {
      const { confirmation, ...fields } = form
      const { client } = await updateClientAccount(clientSessionToken,fields)
      updateClientProfile(client)
      setForm(current=>({...current,...client,current_password:'',new_password:'',confirmation:''}))
      setSuccess('Account updated. Use your updated phone number or shipping mark to sign in. Other devices are signed out after a phone or password change.')
    } catch(err){setError(err.message || 'Could not save your account. Please try again.')}
    finally{setBusy(false)}
  }
  return <section className="card" style={{maxWidth:640,margin:'0 auto'}} aria-label="Account and security">
    <h2 style={{fontSize:20,marginBottom:8}}>Account &amp; security</h2>
    <p style={{fontSize:13,color:'var(--muted)',marginBottom:20}}>Keep your contact details up to date. Your shipping mark stays <strong>{clientUser.shipping_mark}</strong>.</p>
    <form onSubmit={save}>
      <fieldset disabled={busy} style={{border:0,padding:0,margin:0,minWidth:0}}>
        {[['full_name','Full name','text',120,'name'],['phone','Phone number','tel',16,'tel'],['country','Country','text',80,'country-name'],['state','City / district','text',100,'address-level1']].map(([name,label,type,max,auto])=><div className="input-group" key={name}>
          <label className="input-label" htmlFor={`account-${name}`}>{label}</label>
          <input className="input-field" style={{fontSize:16}} id={`account-${name}`} name={name} type={type} autoComplete={auto} value={form[name]} onChange={change} required maxLength={max} minLength={name==='phone'?undefined:2} pattern={name==='phone'?'\\+[1-9][0-9]{7,14}':undefined}/>
          {name==='phone'&&<small>Include the country code, for example +26771234567. No SMS verification is sent.</small>}
        </div>)}
        <hr style={{margin:'20px 0',border:0,borderTop:'1px solid var(--border)'}}/>
        <div className="input-group"><label className="input-label" htmlFor="account-current">Current password</label><input className="input-field" style={{fontSize:16}} id="account-current" name="current_password" type="password" autoComplete="current-password" required value={form.current_password} onChange={change}/><small>Required to authorize any changes.</small></div>
        <div className="input-group"><label className="input-label" htmlFor="account-new">New password (optional)</label><input className="input-field" style={{fontSize:16}} id="account-new" name="new_password" type="password" autoComplete="new-password" minLength={10} value={form.new_password} onChange={change}/><small>Leave blank to keep your password. Use at least 10 characters.</small></div>
        <div className="input-group"><label className="input-label" htmlFor="account-confirm">Confirm new password</label><input className="input-field" style={{fontSize:16}} id="account-confirm" name="confirmation" type="password" autoComplete="new-password" required={!!form.new_password} value={form.confirmation} onChange={change}/></div>
        {error&&<p role="alert" style={{color:'var(--danger)',marginBottom:12}}>{error}</p>}
        {success&&<p role="status" style={{color:'#087b55',marginBottom:12}}>{success}</p>}
        <button type="submit" className="btn btn-primary btn-full">{busy?'Saving…':'Save account changes'}</button>
      </fieldset>
    </form>
  </section>
}
