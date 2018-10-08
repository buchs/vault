package builtinplugins

import (
	"github.com/hashicorp/vault/helper/consts"
)

// TODO could this code be more graceful? should the maps be on the struct?
type Registry struct{}

// Get returns the BuiltinFactory func for a particular backend plugin
// from the databasePlugins map.
func (r *Registry) Get(name string, pluginType consts.PluginType) (func() (interface{}, error), bool) {
	switch pluginType {
	case consts.PluginTypeCredential:
		f, ok := credentialBackends[name]
		return toFunc(f), ok
	case consts.PluginTypeSecrets:
		f, ok := logicalBackends[name]
		return toFunc(f), ok
	case consts.PluginTypeDatabase:
		f, ok := databasePlugins[name]
		return f, ok
	default:
		return nil, false
	}
}

// Keys returns the list of plugin names that are considered builtin databasePlugins.
func (r *Registry) Keys(pluginType consts.PluginType) []string {
	var keys []string
	switch pluginType {
	case consts.PluginTypeDatabase:
		for key := range databasePlugins {
			keys = append(keys, key)
		}
	case consts.PluginTypeCredential:
		for key := range credentialBackends {
			keys = append(keys, key)
		}
	case consts.PluginTypeSecrets:
		for key := range logicalBackends {
			keys = append(keys, key)
		}
	}
	return keys
}

func toFunc(ifc interface{}) func() (interface{}, error) {
	return func() (interface{}, error) {
		return ifc, nil
	}
}
