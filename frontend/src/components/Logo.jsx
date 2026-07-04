import logo from '../assets/logo-aguas-vivas.png';

export default function Logo({ className = '', alt = 'Casa Terapêutica Águas Vivas' }) {
  return <img src={logo} alt={alt} className={className} />;
}
