import ClientServices from './ClientServices'

export default function ClientHome({ client, navigate }) {
  return <div className="nm-client client-service-home">
    <header className="nm-page-heading"><div>
      <span className="nm-eyebrow">WELCOME TO NANDIPHA M</span>
      <h1>Hello, {client.full_name?.split(' ')[0]}.</h1>
      <p>What would you like to do today?</p>
    </div></header>
    <ClientServices navigate={navigate} />
  </div>
}
