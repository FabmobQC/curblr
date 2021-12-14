import json
import os
import sys

from turfpy.measurement import boolean_point_in_polygon
from geojson import Point, Polygon, Feature

PATH = "data/"
INPUT_FOLDER_PATH = "data/input"
INTERMEDIARY_FOLDER_PATH = "data/intermediary"
OUTPUT_FOLDER_PATH = "data/output"
DEFAULT_CONFIG_PATH = "configs/config_default.json"

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
            outfile = "mtl-signalec-places-oasis-bellechasse-plaza.filtred.geojson"
        else:
            arrondissement_name = arrondissement_montreal.replace(" ", "-").replace("+", "-")
            outfile = f"mtl-signalec-{arrondissement_name}.filtred.geojson"
        with open(f"{INTERMEDIARY_FOLDER_PATH}/{outfile}", mode="w") as f:
            json.dump(data, f)
        print("filtrage terminé")

        l_out_file.append(f"{INTERMEDIARY_FOLDER_PATH}/{outfile}")

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
        outfile = f"mtl-subset-{arrondissement_montreal}.geojson"
    else:
        arrondissement_name = arrondissement_montreal.replace(" ", "-").replace("+", "-")
        outfile = f"mtl-signalec-{arrondissement_name}.filtred.geojson"
    with open(f"{INTERMEDIARY_FOLDER_PATH}/{outfile}", mode="w") as f:
        json.dump(data, f)
    print("filtrage terminé")

    l_out_file.append(f"{INTERMEDIARY_FOLDER_PATH}/{outfile}")

    return l_out_file


def check_avaialble_arronds():
    arrondissements_from_json = set([])
    agregate_sign_file = f'{INTERMEDIARY_FOLDER_PATH}/agregate-signalisation.json'
    with open(agregate_sign_file) as f:
        data = json.load(f)
        for i in (data["features"]):
            a = i["properties"]["NOM_ARROND"]
            arrondissements_from_json.add(a)
        for i in arrondissements_from_json:
            print(i)


def update(arronds, noms_sous_quartiers=[], specific_arrond="", data_sub_arronds=""):
    print("Retrieve online data... ", end="")
    os.system(f"wget -N -P {INPUT_FOLDER_PATH} https://storage.googleapis.com/dx-montreal/resources/52cecff0-2644-4258-a2d1-0c4b3b116117/signalisation_stationnement.geojson")
    os.system(f"wget -N -P {INPUT_FOLDER_PATH} https://storage.googleapis.com/dx-montreal/resources/0795f422-b53b-41ca-89be-abc1069a88c9/signalisation-codification-rpa.json")
    print("done")

    print("create regulations... ", end="")
    f_rpa_in = f"{INPUT_FOLDER_PATH}/signalisation-codification-rpa.json"
    f_rpa_out = f"{INTERMEDIARY_FOLDER_PATH}/signalisation-codification-rpa_withRegulation.json"
    os.system(f"node scripts/rpa_to_regulations.js {f_rpa_in} {f_rpa_out}")
    print("done")
    
    print("create pannonceau... ", end="")
    os.system(f"node scripts/pannonceau_to_regulations.js jsonpan {INTERMEDIARY_FOLDER_PATH}/agregate-pannonceau-rpa.json")
    print(" ... ", end="")
    os.system(f"node scripts/pannonceau_to_regulations.js jsonmtl {INTERMEDIARY_FOLDER_PATH}/agregate-signalisation.json")
    print("done")
   
    print("create subset... ", end="")
    for arrond in arronds:

        f_subset = f"{INTERMEDIARY_FOLDER_PATH}/mtl-subset-{arrond}.geojson"
        f_subset = f_subset.replace(" ", "")
        os.system(f"node scripts/subset.js {f_subset} {arrond}")

        filter_min(f_subset, arrond, f"{INPUT_FOLDER_PATH}/plaza-saint-hubert.geojson")
        
        print("done")

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
            os.system(f"shst match {f_subset} \
                        --search-radius=15 \
                        --offset-line=10 \
                        --snap-side-of-street \
                        --buffer-points")

            print("transform to segment... ", end="")
            f_subset_in = f_subset.replace(".geojson", ".buffered.geojson")
            f_subset_segment_out = f_subset.replace(".geojson", "-segment.geojson")
            os.system(f"node scripts/mtl_to_segment.js {f_subset_in} {f_subset_segment_out}")
            print("done")

            print("generate curblr... ", end="")

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

            f_subset_joined_in = f_subset.replace(".geojson", "-segment.joined.geojson")
            if specific_arrond == "":
                f_subset_curblr_out = f"mtl-subset-segment-{arrond}.curblr.json"
            else:
                f_subset_curblr_out = f_subset.replace("signalec", "subset-segment")
                f_subset_curblr_out = f_subset_curblr_out.replace(".filtred.geojson", ".curblr.json")
            f_subset_curblr_out = f_subset_curblr_out.replace(" ", "").lower()

            os.system(f"node scripts/segment_to_curblr.js {f_subset_joined_in} {OUTPUT_FOLDER_PATH}/{f_subset_curblr_out}")

            print(f"{f_subset_curblr_out} ", end="")
            print("done")


if __name__ == "__main__":
    try:
        config_path = sys.argv[1]
    except IndexError:
        config_path = DEFAULT_CONFIG_PATH

    with open(config_path) as config_file:
        config = json.load(config_file)
        update(**config)
