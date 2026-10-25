import { Plane, ArrowUpRight } from 'lucide-react'
import { formatMoney } from './UI'
import '../styles/air-shipping-rates.css'

export default function AirShippingRates({ settings = {}, loading = false, onEnquire }) {
  const rate = Number(settings.air_rate_kg)
  const published = Number.isFinite(rate) && rate > 0
  return <section className="air-shipping-rates" aria-labelledby="air-shipping-rates-title">
    <div className="air-rate-heading"><span className="air-rate-icon"><Plane size={24} /></span><div><span>CHINA TO BOTSWANA</span><h2 id="air-shipping-rates-title">Air shipping prices</h2></div></div>
    <div className="air-rate-body">
      <div className="air-rate-price" role="status">{loading ? <span>Loading current rate…</span> : published ? <><strong>{formatMoney(rate, 'BWP')}</strong><span>per kg</span></> : <span>Contact the team for the current air shipping rate.</span>}</div>
      {!loading && settings.air_rate_notes && <p className="air-rate-notes">{settings.air_rate_notes}</p>}
      <p className="air-rate-disclaimer">Final shipping charges are confirmed by the team for your shipment.</p>
      <button type="button" onClick={onEnquire}>Ask about air shipping <ArrowUpRight size={17} /></button>
    </div>
  </section>
}
