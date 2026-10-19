import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/landing/LegalPage";
import { CONTACT, LINKS } from "@/components/landing/content";

export const metadata: Metadata = {
  title: "Términos del servicio | Createam",
  description: "Condiciones de uso de createam.cloud y de Catálogo Digital para los negocios que crean su tienda.",
  alternates: { canonical: "https://createam.cloud/terminos" },
};

const VERSION = "19 de octubre de 2026";

export default function TerminosPage() {
  return (
    <LegalPage title="Términos del servicio" version={VERSION}>
      <section>
        <h2>1. Qué cubren estos términos</h2>
        <p>
          Createam ofrece en createam.cloud <strong>Catálogo Digital</strong>, una plataforma para que un negocio cree su
          tienda online y reciba pedidos por WhatsApp. Estos términos regulan el uso de este sitio y de Catálogo Digital.
          CyberPOS y OnTurn, que también presentamos aquí, tienen sus propios términos en sus plataformas.
        </p>
        <p>
          Al crear una cuenta o usar el servicio aceptas estos términos. Si los aceptas en nombre de un negocio, declaras
          que puedes representarlo.
        </p>
      </section>

      <section>
        <h2>2. Tu cuenta</h2>
        <p>
          Para crear una tienda registras el nombre de tu negocio, un correo, un teléfono y una contraseña, y verificas el
          correo con un código. Los datos deben ser verdaderos. Eres responsable de lo que se haga con tu cuenta y de
          mantener tu contraseña en reserva; si crees que alguien más la usó, avísanos.
        </p>
      </section>

      <section>
        <h2>3. Prueba gratuita, planes y pagos</h2>
        <ul>
          <li>
            Cada tienda empieza con una <strong>prueba gratuita</strong>. Para seguir usándola después eliges un
            plan.
          </li>
          <li>
            Los planes, sus límites y sus precios en soles se publican en createam.cloud. Puedes pagar mes a mes o el año
            completo por adelantado.
          </li>
          <li>El plan se paga desde tu cuenta de CyberPOS, por los medios de pago disponibles en cada momento.</li>
          <li>
            No hay permanencia: puedes dejar de renovar cuando quieras. Si un periodo vence sin pago, podemos limitar
            funciones de la tienda o suspenderla hasta que se regularice.
          </li>
          <li>Los periodos ya pagados no se reembolsan, salvo cobro duplicado o error nuestro.</li>
          <li>
            Si cambiamos los precios, lo avisaremos con anticipación y el cambio se aplicará desde tu siguiente renovación.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Tu tienda y tu contenido</h2>
        <p>
          El contenido de tu tienda (productos, fotos, precios, textos y logo) es tuyo y eres responsable de él: de que
          sea veraz, de que tengas derecho a usarlo y de que lo que ofreces pueda venderse legalmente en el Perú. Nos
          autorizas a alojarlo y mostrarlo para operar tu tienda.
        </p>
        <p>
          No está permitido ofrecer productos ilegales o falsificados, publicar contenido engañoso, ofensivo o que
          infrinja derechos de terceros, ni usar la plataforma para enviar mensajes no solicitados, extraer datos o
          interferir con su funcionamiento. Podemos retirar contenido o suspender las tiendas que lo incumplan.
        </p>
      </section>

      <section>
        <h2>5. Tus ventas</h2>
        <p>
          Los pedidos de tu tienda llegan a tu WhatsApp y la venta se cierra directamente entre tú y tu cliente. Createam
          no cobra comisión por esas ventas, no recibe esos pagos y no es parte de la compraventa. La atención, la
          entrega, los comprobantes de pago, las garantías y las demás obligaciones frente al consumidor son
          responsabilidad de tu negocio.
        </p>
      </section>

      <section>
        <h2>6. Dirección y dominio</h2>
        <p>
          Tu tienda recibe una dirección dentro de createam.cloud. En los planes que lo incluyen puedes conectar tu propio
          dominio; ese dominio lo contratas y lo renuevas tú con tu proveedor.
        </p>
      </section>

      <section>
        <h2>7. Disponibilidad y cambios del servicio</h2>
        <p>
          Trabajamos para que el servicio esté disponible y funcione bien, pero no garantizamos que sea ininterrumpido:
          puede haber mantenimientos o fallas de terceros, como el alojamiento, WhatsApp o los medios de pago. Podemos mejorar,
          cambiar o retirar funciones; si un cambio te afecta de forma importante, te avisaremos.
        </p>
      </section>

      <section>
        <h2>8. Propiedad intelectual</h2>
        <p>
          La plataforma, su diseño y su software pertenecen a Createam. Puedes usarla mientras tengas una cuenta activa;
          no puedes copiarla, revenderla ni intentar acceder a su código.
        </p>
      </section>

      <section>
        <h2>9. Cierre de la cuenta</h2>
        <p>
          Puedes pedir el cierre de tu cuenta escribiéndonos. Al cerrarla, tu tienda deja de estar visible y eliminamos
          sus datos según nuestra <Link href="/privacidad">Política de privacidad</Link>. Podemos suspender o cerrar una
          cuenta que incumpla estos términos.
        </p>
      </section>

      <section>
        <h2>10. Responsabilidad</h2>
        <p>
          En la medida en que la ley lo permite, Createam no responde por ventas no concretadas, ganancias dejadas de
          percibir ni daños indirectos derivados del uso del servicio, ni por el contenido o la conducta de los negocios y
          de sus clientes. Nada de esto limita los derechos que la ley peruana te reconoce.
        </p>
      </section>

      <section>
        <h2>11. Datos personales</h2>
        <p>
          El tratamiento de tus datos se rige por nuestra <Link href="/privacidad">Política de privacidad</Link> (Ley N.°
          29733).
        </p>
      </section>

      <section>
        <h2>12. Cambios a estos términos</h2>
        <p>
          Podemos actualizar estos términos. Publicaremos aquí la versión vigente con su fecha y, si el cambio es
          sustancial, te lo avisaremos por correo o en tu panel.
        </p>
      </section>

      <section>
        <h2>13. Ley aplicable y contacto</h2>
        <p>
          Estos términos se rigen por las leyes de la República del Perú. Para cualquier consulta o reclamo escríbenos a{" "}
          <a href={LINKS.email}>{CONTACT.email}</a> o por <a href={LINKS.whatsapp}>WhatsApp al {CONTACT.phone}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
