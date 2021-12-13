import os
import json
from turfpy.measurement import boolean_point_in_polygon
from geojson import Point, Polygon, Feature

arronds = [
    # "LaSalle",
    "Ville-Marie",
    "Côte-des-Neiges - Notre-Dame-de-Grâce",  # null
    # # "None",
    # "Montréal-Nord",
    "Saint-Léonard",  # null
    # "Verdun",
    "L'Île-Bizard - Sainte-Geneviève",  # present mais
    "Sud-Ouest",  # null
    # "Villeray - Saint-Michel - Parc-Extension",
    # "Anjou",
    # "Lachine",
    # "Plateau-Mont-Royal",
    # "Rivière-des-Prairies - Pointe-aux-Trembles",
    # "Rosemont - La Petite-Patrie",
    # "Mercier - Hochelaga-Maisonneuve",
    # "Pierrefonds - Roxboro",
    "Outremont",  # lourd bug
    # "Ahuntsic - Cartierville",
    # "Saint-Laurent"
]
arronds = [
    "plaza",
    "LaSalle",
    "Ville-Marie",
    "Côte-des-Neiges - Notre-Dame-de-Grâce",  # null
    # "None",
    "Montréal-Nord",
    "Saint-Léonard",  # null
    "Verdun",
    "L'Île-Bizard - Sainte-Geneviève",  # present mais
    "Sud-Ouest",  # null
    "Villeray - Saint-Michel - Parc-Extension",
    "Anjou",
    "Lachine",
    "Plateau-Mont-Royal",
    "Rivière-des-Prairies - Pointe-aux-Trembles",
    "Rosemont - La Petite-Patrie",
    "Mercier - Hochelaga-Maisonneuve",
    "Pierrefonds - Roxboro",
    "Outremont",  # lourd bug
    "Ahuntsic - Cartierville",
    "Saint-Laurent"
]

PATH = "data/"


def filter(arronds=["Rosemont-La Petite-Patrie"], data_to_cut="", specific_arrond="Ville-Marie", data_sub_arronds="quartiers_arrodissement_villemarie.geojson"):
    l_out_file = []
    for i in arronds:
        arrondissement_montreal = i
        polygone = []

        file_to_open = data_sub_arronds if specific_arrond == "Ville-Marie" else "limadmin.geojson.json"
        with open(file_to_open) as f:
            data = json.load(f)
            for i in (data["features"]):
                if i["properties"]["NOM"] == arrondissement_montreal:
                    polygone = i["geometry"]["coordinates"][0] if specific_arrond != "Ville-Marie" else i["geometry"]["coordinates"]
                    break

        point_a_tester = []
        data = ""
        m = 0
        file_to_open = ""
        if data_to_cut != "":
            file_to_open = data_to_cut
        else:
            return
        with open(file_to_open) as f:
            data = json.load(f)
            n = 0
            p = 0
            l = []
            for i in (data["features"]):
                m += 1
                point_a_tester = i["geometry"]["coordinates"]
                # print(i["properties"]["nPositionCentreLongitude"])
                # print(point_a_tester)
                point_format_turfpy = Feature(geometry=Point(point_a_tester))
                polygone_format_turfpy = Polygon(polygone)
                if(boolean_point_in_polygon(point_format_turfpy, polygone_format_turfpy)) == True:
                    l.append(i)
                    p += 1
                else:
                    n += 1
            data["features"] = l
        print(arrondissement_montreal, "-- in: ",
              p, ", out: ", n, ", total: ", m)
        if arrondissement_montreal == "plaza":
            outfile = "mtl-signalec-" + \
                "places-oasis-bellechasse-plaza".replace(
                    " ", "-").replace("+", "-") + ".filtred.geojson"
        else:
            outfile = "mtl-signalec-" + \
                arrondissement_montreal.replace(
                    " ", "-").replace("+", "-") + ".filtred.geojson"
        with open(PATH + outfile, mode="w") as f:
            json.dump(data, f)
        print("filtrage terminé")

        l_out_file.append(PATH + outfile)

    return l_out_file


def filter_min(data_to_cut, arrondissement_montreal, data_sub_arronds):
    l_out_file = []
    polygone = []
    file_to_open = data_sub_arronds
    with open(file_to_open) as f:
        data = json.load(f)
        polygone = data["features"][0]["geometry"]["coordinates"]

    point_a_tester = []
    data = ""
    m = 0
    file_to_open = ""
    if data_to_cut != "":
        file_to_open = data_to_cut
    else:
        return

    with open(file_to_open) as f:
        data = json.load(f)
        n = 0
        p = 0
        l = []
        for i in (data["features"]):
            m += 1
            point_a_tester = i["geometry"]["coordinates"]
            # print(i["properties"]["nPositionCentreLongitude"])
            # print(point_a_tester)
            point_format_turfpy = Feature(geometry=Point(point_a_tester))
            polygone_format_turfpy = Polygon(polygone)
            if(boolean_point_in_polygon(point_format_turfpy, polygone_format_turfpy)) == True:
                l.append(i)
                p += 1
            else:
                n += 1
        data["features"] = l
    print(arrondissement_montreal, "-- in: ", p, ", out: ", n, ", total: ", m)
    if arrondissement_montreal == "plaza":
        # outfile = "mtl-signalec-" + "places-oasis-bellechasse-plaza".replace(" ","-").replace("+","-") + ".filtred.geojson"
        outfile = "mtl-subset-" + arrondissement_montreal + ".geojson"
    else:
        outfile = "mtl-signalec-" + \
            arrondissement_montreal.replace(
                " ", "-").replace("+", "-") + ".filtred.geojson"
    with open(PATH + outfile, mode="w") as f:
        json.dump(data, f)
    print("filtrage terminé")

    l_out_file.append(PATH + outfile)

    return l_out_file


def check_avaialble_arronds():
    arrondissements_from_json = set([])
    agregate_sign_file = 'data/agregate-signalisation.json'
    with open(agregate_sign_file) as f:
        data = json.load(f)
        for i in (data["features"]):
            a = i["properties"]["NOM_ARROND"]
            arrondissements_from_json.add(a)
        for i in arrondissements_from_json:
            print(i)


def update(arronds, noms_sous_quartiers=[], specific_arrond="", data_sub_arronds=""):
    os.system("echo -n 'Retrieve online data... '")
    os.system("wget -N -P data https://storage.googleapis.com/dx-montreal/resources/52cecff0-2644-4258-a2d1-0c4b3b116117/signalisation_stationnement.geojson")
    os.system("wget -N -P data https://storage.googleapis.com/dx-montreal/resources/0795f422-b53b-41ca-89be-abc1069a88c9/signalisation-codification-rpa.json")
    os.system("echo 'done'")

    os.system("echo -n 'create regulations... '")
    f_rpa_in = "data/signalisation-codification-rpa.json"
    f_rpa_out = "data/signalisation-codification-rpa_withRegulation.json"
    os.system(f"node rpa_to_regulations.js {f_rpa_in} {f_rpa_out}")
    os.system("echo 'done'")
    
    os.system("echo -n 'create pannonceau... '")
    os.system(
        "node pannonceau_to_regulations.js jsonpan data/agregate-pannonceau-rpa.json")
    os.system("echo -n ' ... '")
    os.system(
        "node pannonceau_to_regulations.js jsonmtl data/agregate-signalisation.json")
    os.system("echo 'done'")

    os.system("rm data/mtl-subset*")
   
    os.system("echo -n 'create subset... '")
    # with open("s.txt", "w", encoding="utf-8") as f:
    for arrond in arronds:

        f_subset = f"data/mtl-subset-{arrond}.geojson"
        f_subset = f_subset.replace(" ", "")
        os.system(f"node subset.js {f_subset} {arrond}")

        filter_min(f_subset, arrond, "plaza-saint-hubert.geojson")
        
        os.system("echo 'done'")

        f_subset_subarronds = []
        if len(noms_sous_quartiers) > 0 and specific_arrond != "" and data_sub_arronds != "" and arrond == specific_arrond:
            f_subset_subarronds = filter(
                arronds=noms_sous_quartiers,
                data_to_cut=f_subset,
                specific_arrond=specific_arrond,
                data_sub_arronds=data_sub_arronds)
        else:
            f_subset_subarronds = [f_subset]

        for f_subset in f_subset_subarronds:
            print("XXXXXX", f_subset)
            os.system("shst match " + f_subset + " \
                --search-radius=15 \
                    --offset-line=10 \
                        --snap-side-of-street \
                                --buffer-points")

            os.system("echo -n 'transform to segment... '")
            f_subset_in = f_subset.replace(".geojson", ".buffered.geojson")
            f_subset_segment_out = f_subset.replace(
                ".geojson", "-segment.geojson")
            os.system("node mtl_to_segment.js " +
                      f_subset_in + " > " + f_subset_segment_out)
            os.system("echo 'done'")

            os.system("echo -n 'generate curblr... '")

            cmd = f"shst match {f_subset_segment_out} --join-points \
             --join-points-match-fields=PANNEAU_ID_RPA,CODE_RPA \
                --search-radius=15 \
                 --snap-intersections \
                  --snap-intersections-radius=10 \
                --trim-intersections-radius=5 \
                 --buffer-merge-group-fields=POTEAU_ID_POT,PANNEAU_ID_PAN \
                --buffer-points \
                # --direction-field=direction --two-way-value=two --one-way-against-direction-value=against --one-way-with-direction-value=one \
                "
            os.system(cmd)

            f_subset_joined_in = f_subset.replace(
                ".geojson", "-segment.joined.geojson")
            if specific_arrond == "":
                f_subset_curblr_out = "mtl-subset-segment_all.curblr.json".replace(
                    "_all", "-" + arrond)
            else:
                f_subset_curblr_out = f_subset.replace(
                    "signalec", "subset-segment")
                f_subset_curblr_out = f_subset_curblr_out.replace(
                    ".filtred.geojson", ".curblr.json")
            f_subset_curblr_out = f_subset_curblr_out.replace(" ", "").lower()

            os.system("node segment_to_curblr.js " +
                      f_subset_joined_in + " > " + f_subset_curblr_out)

            assets_curb_map = os.path.join(
                "..", "..", "curb-map", "src", "assets", "data")
            print(assets_curb_map)
            print(f_subset_curblr_out)
            os.system("mv " + f_subset_curblr_out + " " + assets_curb_map)

            os.system("echo transfert to curb-map done")
            #os.system("node stats.js > data/mtl-subset-unmanaged.geojson")
            # f.write('{ path: "' + f_subset_curblr_out + '", label: "mtl - ' + arrond + '" },\n')

    os.system("date")


if __name__ == "__main__":
    os.system("nvm use 12.7.0")
    ville_marie_quartiers = [
        "DOWNTOWN",
        "QUARTIER DES SPECTACLES",
        "GAY VILLAGE",
        "OLD MONTREAL",
        "JEAN-DRAPEAU",
    ]
    specific_arrond = "Ville-Marie"
    data_sub_arronds = "quartiers_arrodissement_villemarie.geojson"
    # update(["LaSalle", "Ville-Marie"], ville_marie_quartiers, specific_arrond, data_sub_arronds)
    update([arronds[0]])
