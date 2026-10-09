package ca.surferpixies.energie;

import android.app.Activity;
import android.os.Bundle;
import android.widget.ScrollView;
import android.widget.TextView;

public class HealthPrivacyActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        TextView text = new TextView(this);
        text.setTextSize(17);
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        text.setPadding(padding, padding, padding, padding);
        text.setText("Énergie — Health Connect\n\n"
            + "Avec ton autorisation, Énergie lit tes pas, tes stades de sommeil, tes séances d’activité et ton poids pour compléter ton journal et présenter des tendances. Tu peux autoriser chaque catégorie séparément. Énergie n’écrit aucune donnée dans Health Connect.\n\n"
            + "Les données importées sont conservées sur ton appareil et synchronisées avec ton compte Énergie dans Supabase. Un professionnel lié avec ton autorisation peut consulter le journal et les tendances. Les photos ont des autorisations distinctes.\n\n"
            + "Tu peux arrêter les imports depuis le Profil ou retirer les permissions dans Health Connect. Arrêter les imports ne supprime pas l’historique déjà enregistré.\n\n"
            + "La suppression du compte Énergie est irréversible et retire ses données associées; elle ne supprime pas les données originales de Health Connect, les copies exportées ou les sauvegardes temporaires de l’hébergeur.\n\n"
            + "Énergie ne fournit pas de diagnostic médical. Les renseignements de confidentialité du Profil expliquent également le stockage et le partage de ton journal.");
        ScrollView scroll = new ScrollView(this);
        scroll.addView(text);
        setContentView(scroll);
    }
}
