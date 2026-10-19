import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/landing/LegalPage";
import { CONTACT, LINKS } from "@/components/landing/content";

export const metadata: Metadata = {
  title: "Política de privacidad | Createam",
  description: "Qué datos trata Createam en createam.cloud y en Catálogo Digital, para qué los usa y cómo ejercer tus derechos según la Ley N.° 29733.",
  alternates: { canonical: "https://createam.cloud/privacidad" },
};

const VERSION = "19 de octubre de 2026";

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" version={VERSION}>
      <section>
        <h2>1. Quiénes somos y qué cubre esta política</h2>
        <p>
          Createam opera createam.cloud y <strong>Catálogo Digital</strong> desde Lima, Perú. A efectos de la Ley N.°
          29733, Ley de Protección de Datos Personales, y su reglamento, Createam es responsable de los datos de quienes
          visitan este sitio y de los negocios que crean una cuenta. Cada negocio es responsable de los datos de sus
          propios clientes.
        </p>
        <p>CyberPOS y OnTurn, que también presentamos aquí, tienen sus propias políticas en sus plataformas.</p>
      </section>

      <section>
        <h2>2. Qué datos tratamos y para qué</h2>
        <ul>
          <li>
            <strong>Datos de registro</strong> (nombre del negocio, correo, teléfono y contraseña): para crear tu cuenta,
            verificar tu correo, darte acceso al panel y contactarte sobre el servicio. La contraseña se guarda protegida
            y no podemos verla.
          </li>
          <li>
            <strong>Contenido de tu tienda</strong> (productos, fotos, precios, logo, WhatsApp y redes sociales): para
            publicar tu catálogo.
          </li>
          <li>
            <strong>Datos de pago</strong>: cuando pagas tu plan, guardamos el plan, el periodo y el registro del pago;
            no guardamos los datos de tu tarjeta.
          </li>
          <li>
            <strong>Estadísticas de cada tienda</strong>: contamos las visitas y los clics en el botón de WhatsApp para
            mostrárselos al negocio. Son contadores y no identifican a quién visitó.
          </li>
          <li>
            <strong>Registro de actividad</strong>: guardamos qué cuenta hizo cambios en una tienda, como crear o eliminar
            un producto, por seguridad.
          </li>
          <li>
            <strong>Navegación en createam.cloud</strong>: usamos Google Analytics para saber cuántas personas visitan el
            sitio, qué páginas ven y qué botones usan. Para eso Google coloca cookies en tu navegador y recibe datos
            técnicos como el tipo de dispositivo, el navegador y la ubicación aproximada. Esta medición no está activa en
            las tiendas de los negocios.
          </li>
        </ul>
        <p>
          <strong>Si compras en una tienda:</strong> no necesitas crear una cuenta. Tu carrito se guarda solo en tu propio
          navegador y el pedido viaja por WhatsApp directamente al negocio; Createam no recibe ese mensaje ni tus datos.
        </p>
      </section>

      <section>
        <h2>3. Con quién se comparten</h2>
        <p>
          No vendemos tus datos ni los usamos para publicidad de terceros. Solo acceden a ellos los proveedores que
          necesitamos para operar: Google (cuentas, base de datos e imágenes con Firebase, y Google Analytics), Resend
          (envío de correos, como el código de verificación), las entidades de pago que uses y el proveedor de servidores
          donde corre la plataforma. Algunos de ellos guardan la información en servidores fuera del Perú. Tu cuenta, tus
          productos y los pagos de tu plan se gestionan en CyberPOS, que también es de Createam.
        </p>
      </section>

      <section>
        <h2>4. Cuánto tiempo los conservamos</h2>
        <p>
          Mientras tu cuenta esté activa. Si pides cerrarla, eliminamos los datos de tu cuenta y de tu tienda, salvo lo
          que debamos conservar por obligaciones legales, como los registros de pagos.
        </p>
      </section>

      <section>
        <h2>5. Tus derechos</h2>
        <p>
          Tienes derecho de acceso, rectificación, cancelación y oposición sobre tus datos. Los datos de tu tienda puedes
          corregirlos desde tu panel. Para lo demás, escríbenos a <a href={LINKS.email}>{CONTACT.email}</a> desde el
          correo de tu cuenta y te responderemos dentro de los plazos de la Ley N.° 29733 y su reglamento.
        </p>
        <p>
          Si consideras que no atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos
          Personales, del Ministerio de Justicia y Derechos Humanos.
        </p>
      </section>

      <section>
        <h2>6. Cookies y datos en tu navegador</h2>
        <ul>
          <li>
            <strong>Para funcionar:</strong> lo que mantiene tu sesión iniciada en el panel y el carrito de las tiendas,
            que se guardan en tu navegador.
          </li>
          <li>
            <strong>Para medir:</strong> las cookies de Google Analytics, descritas en la sección 2.
          </li>
        </ul>
        <p>
          Puedes bloquearlas o borrarlas desde tu navegador. El sitio seguirá funcionando, aunque tendrás que volver a
          iniciar sesión en el panel.
        </p>
      </section>

      <section>
        <h2>7. Seguridad</h2>
        <p>
          Usamos conexión cifrada (HTTPS), contraseñas protegidas, códigos de verificación de un solo uso que caducan,
          acceso de cada negocio limitado a su propia tienda y límites a la cantidad de solicitudes. Ningún sistema es
          infalible, pero tratamos solo los datos necesarios para operar.
        </p>
      </section>

      <section>
        <h2>8. Cambios a esta política</h2>
        <p>
          Si cambiamos esta política, publicaremos aquí la nueva versión con su fecha y, si el cambio es sustancial, te
          lo avisaremos por correo o en tu panel.
        </p>
      </section>

      <section>
        <h2>9. Contacto</h2>
        <p>
          Para cualquier consulta sobre tus datos escríbenos a <a href={LINKS.email}>{CONTACT.email}</a>. También puedes
          revisar los <Link href="/terminos">Términos del servicio</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
