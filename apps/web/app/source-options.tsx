import styles from "./onboarding/onboarding.module.css";

export function BrandSourceOptions() {
  return (
    <fieldset className={styles.sourceOptions}>
      <legend>Choose your connections</legend>
      <p className={styles.sourceIntro}>Connect any combination now. You can skip or change these later in Brand Brain.</p>
      <label className={styles.sourceChoice}>
        <input name="connect-instagram" type="checkbox" value="yes" defaultChecked aria-describedby="instagram-source-help" />
        <span>
          <span className={styles.sourceTitle}><strong>Connect Instagram</strong><em>Recommended</em></span>
          <small id="instagram-source-help">Use Instagram Login with a Professional account. A Facebook Page is not required.</small>
        </span>
      </label>
      <label className={styles.sourceChoice}>
        <input name="connect-facebook-instagram" type="checkbox" value="yes" aria-describedby="facebook-instagram-source-help" />
        <span>
          <strong>Connect Facebook + Instagram</strong>
          <small id="facebook-instagram-source-help">Use Facebook Login, select a Page, then connect its linked Instagram Professional account.</small>
        </span>
      </label>
      <label className={styles.sourceChoice}>
        <input name="connect-facebook" type="checkbox" value="yes" aria-describedby="facebook-source-help" />
        <span>
          <strong>Connect Facebook only</strong>
          <small id="facebook-source-help">Connect a Facebook Page for businesses that only need Facebook publishing.</small>
        </span>
      </label>
    </fieldset>
  );
}
