package builtinplugins

import (
	"strings"

	"github.com/hashicorp/vault/helper/consts"
)

// BuiltinFactory is the func signature that should be returned by
// the plugin's New() func.
type BuiltinFactory func() (interface{}, error)

func toBuiltinFactory(ifc interface{}) BuiltinFactory {
	return func() (interface{}, error) {
		return ifc, nil
	}
}

// Get returns the BuiltinFactory func for a particular backend plugin
// from the databasePlugins map.
func Get(name string, pluginType consts.PluginType) (BuiltinFactory, bool) {
	switch pluginType {
	case consts.PluginTypeCredential:
		f, ok := credentialBackends[name]
		return toBuiltinFactory(f), ok
	case consts.PluginTypeSecrets:
		f, ok := logicalBackends[name]
		return toBuiltinFactory(f), ok
	case consts.PluginTypeDatabase:
		f, ok := databasePlugins[name]
		return f, ok
	default:
		return nil, false
	}
}

// Keys returns the list of plugin names that are considered builtin databasePlugins.
func Keys(pluginType consts.PluginType) []string {
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

// ParseKey returns a key's:
//   - Name
//   - PluginType
func ParseKey(key string) (string, consts.PluginType, error) {
	fields := strings.Split(key, "-")
	name := fields[0]
	strType := fields[1]
	pluginType, err := consts.ParsePluginType(strType)
	if err != nil {
		return "", consts.PluginTypeUnknown, err
	}
	return name, pluginType, nil
}
