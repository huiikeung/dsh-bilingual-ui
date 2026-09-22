/**
 * dsh-bilingual-ui — browser plugin face.
 *
 * No services are needed: the engine watches the DOM itself, so `inject` is
 * empty and `apply` just starts the observer. The label rewriting never talks
 * to the Host, touches no credentials, and patches no core bundle.
 */

/** Nothing to inject — this plugin is pure runtime DOM work. */
const inject = [];

/** Start pinning bilingual labels for the lifetime of the page. */
function apply() {
  pinBilingualLabels();
}
