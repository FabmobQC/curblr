# Projet de conversion des données de stationnement de la ville de Montréal vers le format CurbLR


## Préalables
1. Installer yarn et utiliser node 12.13.0 (seule version à la fois compatible avec sharedstreet.js et turf.js)
2. Installer les dépendances de Python
> pip3 install -r requirements.txt
3. Installer [SharedStreets](https://github.com/sharedstreets/sharedstreets-js). En cas de difficulté, builder [cette version](https://github.com/idillon-sfl/sharedstreets-js/tree/make-it-work-again) et exécuter à partir de bin/run.

## Exécuter
1. Exécuter update.py avec la config voulue. Par exemple :
> python3 update.py configs/config_plaza.json

## Exécuter les tests
> cd tests
> yarn test

## Création d’un subset de données
Afin de pouvoir tester rapidement les outils, la création d’un subset de donnée est nécessaire. Le script subset.js permet de faire cela. Il est possible de modifier la zone en indiquant la longitude et latitude encadrant la zone souhaitée dans le script. Attention, à faire un rectangle aligné au nord géographique et non au nord montréalais (environ 45° de différence).


## TODO


* -conversion de l’orientation du panneau et de sa flèche par rapport à la rue-
* -converting en segment shared street-
* mapping entre les descriptions de panneau et les règles curblr, peut être sous-divisé: 
** -heure de permission/interdiction-
** gestion des panonceaux
** vignette/parcomètre
** zone spéciale (taxi, livraison, handicapé, véhicule électrique)
** gestion des panneaux unique (pas d’étendue)




Utilisation des données de signalisation de stationnement:


    {
      "type": "Feature",
      "properties": {
        "POTEAU_ID_POT": 18413,                                         
        "POSITION_POP": 6,                                              conversion en segment
                                                                            Le champ "POSITION_POP" réfère au numéro de la position du panneau sur le poteau en lien à l’approche de visualisation. Il faut référer à un quadrant théorique de huit valeurs de sens horaire où le 1 est au nord.
                                                                            Ex.
                                                                            1 → Visible pour déplacement en direction nord
                                                                            3 → Visible pour déplacement en direction est
                                                                            5 → Visible pour déplacement en direction sud
                                                                            7 → Visible pour déplacement en direction ouest
        "PANNEAU_ID_PAN": 38654,                                        id unique si besoin
        "PANNEAU_ID_RPA": 2317,                                         règle
        "DESCRIPTION_RPA": "\\P 09h-10h MAR. VEN. 1 MARS AU 1 DEC.",    règle
        "CODE_RPA": "SB-VC",                                            règle
        "FLECHE_PAN": 0,                                                Conversion en segment
                                                                            La colonne FLECHE_PAN est un choix entre 0,1,2 ou 3 et les chiffres représentent :
                                                                            0 = pas de flèche
                                                                            1= vers le haut ↑
                                                                            2= vers la gauche ←
                                                                            3= vers la droite →
        "TOPONYME_PAN": null,                                           
        "DESCRIPTION_CAT": "STATIONNEMENT",                             probablement non
        "POTEAU_VERSION_POT": 1,                                        non
        "DATE_CONCEPTION_POT": "NaT",                                   non
        "PAS_SUR_RUE": null,                                            à investiguer
        "DESCRIPTION_REP": "Réel",                                      
        "DESCRIPTION_RTP": "3- Fût",                                    Possibilité?
        "X": 294320.44,                                                 non
        "Y": 5043074,                                                   non
        "Longitude": -73.63416,                                         non
        "Latitude": 45.527504,                                          non
        "NOM_ARROND": "Villeray - Saint-Michel - Parc-Extension"        non
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -73.6341603701353,
          45.52750443097535
        ]
      }
    }