const profiles = {
    '06e99ad3-cded-4440-a19c-b3df4fda8004': 'Meldiron',
    '5ca1fa3a-3413-4863-86d7-7a47982abc1b': 'Dejwfík',
    'f6fe29aa-45dc-4fe9-9a95-d5e2c39f6b5f': 'Benko'
};
export class Utils {
    static getName(id: string) {
        return profiles[id] ? profiles[id] : 'Unnamed Player';
    }
}