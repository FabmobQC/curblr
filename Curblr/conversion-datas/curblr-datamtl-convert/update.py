import json
import os
import sys

PATH = "data/"
INPUT_FOLDER_PATH = "data/input"
INTERMEDIARY_FOLDER_PATH = "data/intermediary"
OUTPUT_FOLDER_PATH = "data/output"
DEFAULT_CONFIG_PATH = "configs/config_arrondissements_propertie.json" # arbitrary default

def update(desired_subsets):
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
    os.system(f"node scripts/pannonceau_to_regulations.js")
    print("done")
    
    for mode, name in desired_subsets:
        name_for_filename = name.replace(" ", "").replace("'", "")
        name_for_command = name.replace("'", "\\'") # Shell interprets apostrophe as "Unterminated quoted string"
        print("create subset... ", end="")
        os.system(f"node scripts/subset.js {mode} {name_for_command}")
        print("done")

        # file created by scripts/subset.js
        f_subset = f"{INTERMEDIARY_FOLDER_PATH}/mtl-subset-{name_for_filename}.geojson"

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
        f_subset_curblr_out = f"mtl-subset-segment-{name_for_filename}.curblr.json"

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
