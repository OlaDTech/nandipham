import { ArrowUpRight, ArrowLeft, MessageCircle } from 'lucide-react'
import '../styles/client-services.css'

const services = [
  { title: 'Shipping', tab: 'shipping', image: 'shipping', description: 'Follow your cargo from China to Botswana.', action: 'Open shipping workspace' },
  { title: 'Shop With Us', tab: 'store', image: 'shopping', description: 'Discover products for you, your home and your business.', action: 'Explore the store' },
  { title: 'China Accompany Services', tab: 'accompany', image: 'china', description: 'Speak to our team about support for your sourcing trip.', action: 'Plan your visit' },
]

export default function ClientServices({ navigate }) {
  return <section className="client-services" aria-labelledby="client-services-title">
    <div className="client-services-heading"><div><span>MADE FOR YOUR NEXT MOVE</span><h2 id="client-services-title">Services</h2></div><p>From your first find to your next delivery.</p></div>
    <div className="client-service-grid">{services.map(service => <button className="client-service-card" key={service.tab} onClick={() => navigate(service.tab)}>
      <div className="client-service-photo"><img src={`/services/${service.image}.jpg`} alt="" width="960" height="640" loading="lazy" /></div>
      <div className="client-service-copy"><h3>{service.title}</h3><p>{service.description}</p><span>{service.action}<ArrowUpRight size={18} /></span></div>
    </button>)}</div>
  </section>
}

export function ChinaAccompany({ onBack, onEnquire }) {
  return <section className="china-accompany">
    <button className="section-back" onClick={onBack}><ArrowLeft size={16} />Back to services</button>
    <img className="china-accompany-photo" src="/services/china.jpg" alt="Architecture in China" width="960" height="640" />
    <div className="china-accompany-copy"><span className="nm-eyebrow">LET’S PLAN YOUR NEXT STEP</span><h1>China Accompany Services</h1><p>Planning a sourcing trip to China? Tell the NandiphaM team when you would like to travel, what you want to source and the support you need.</p><p>Our team will confirm the available services, arrangements and pricing with you in your account messages.</p><button className="btn btn-primary" onClick={onEnquire}><MessageCircle size={18} />Enquire with the team</button></div>
  </section>
}
