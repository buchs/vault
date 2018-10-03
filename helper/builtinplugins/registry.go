package builtinplugins

import (
	"github.com/hashicorp/vault/logical"
	"github.com/hashicorp/vault/plugins/helper/database/credsutil"

	credAliCloud "github.com/hashicorp/vault-plugin-auth-alicloud"
	credAzure "github.com/hashicorp/vault-plugin-auth-azure"
	credCentrify "github.com/hashicorp/vault-plugin-auth-centrify"
	credGcp "github.com/hashicorp/vault-plugin-auth-gcp/plugin"
	credJWT "github.com/hashicorp/vault-plugin-auth-jwt"
	credKube "github.com/hashicorp/vault-plugin-auth-kubernetes"
	credAppId "github.com/hashicorp/vault/builtin/credential/app-id"
	credAppRole "github.com/hashicorp/vault/builtin/credential/approle"
	credAws "github.com/hashicorp/vault/builtin/credential/aws"
	credCert "github.com/hashicorp/vault/builtin/credential/cert"
	credGitHub "github.com/hashicorp/vault/builtin/credential/github"
	credLdap "github.com/hashicorp/vault/builtin/credential/ldap"
	credOkta "github.com/hashicorp/vault/builtin/credential/okta"
	credRadius "github.com/hashicorp/vault/builtin/credential/radius"
	credUserpass "github.com/hashicorp/vault/builtin/credential/userpass"

	dbCass "github.com/hashicorp/vault/plugins/database/cassandra"
	dbHana "github.com/hashicorp/vault/plugins/database/hana"
	dbMongo "github.com/hashicorp/vault/plugins/database/mongodb"
	dbMssql "github.com/hashicorp/vault/plugins/database/mssql"
	dbMysql "github.com/hashicorp/vault/plugins/database/mysql"
	dbPostgres "github.com/hashicorp/vault/plugins/database/postgresql"

	logicalAd "github.com/hashicorp/vault-plugin-secrets-ad/plugin"
	logicalAlicloud "github.com/hashicorp/vault-plugin-secrets-alicloud"
	logicalAzure "github.com/hashicorp/vault-plugin-secrets-azure"
	logicalGcp "github.com/hashicorp/vault-plugin-secrets-gcp/plugin"
	logicalKv "github.com/hashicorp/vault-plugin-secrets-kv"
	logicalAws "github.com/hashicorp/vault/builtin/logical/aws"
	logicalCass "github.com/hashicorp/vault/builtin/logical/cassandra"
	logicalConsul "github.com/hashicorp/vault/builtin/logical/consul"
	logicalDb "github.com/hashicorp/vault/builtin/logical/database"
	logicalMongo "github.com/hashicorp/vault/builtin/logical/mongodb"
	logicalMssql "github.com/hashicorp/vault/builtin/logical/mssql"
	logicalMysql "github.com/hashicorp/vault/builtin/logical/mysql"
	logicalNomad "github.com/hashicorp/vault/builtin/logical/nomad"
	logicalPki "github.com/hashicorp/vault/builtin/logical/pki"
	logicalPostgres "github.com/hashicorp/vault/builtin/logical/postgresql"
	logicalRabbit "github.com/hashicorp/vault/builtin/logical/rabbitmq"
	logicalSsh "github.com/hashicorp/vault/builtin/logical/ssh"
	logicalTotp "github.com/hashicorp/vault/builtin/logical/totp"
	logicalTransit "github.com/hashicorp/vault/builtin/logical/transit"
)

var credentialBackends = map[string]logical.Factory{
	"alicloud":   credAliCloud.Factory,
	"app-id":     credAppId.Factory,
	"approle":    credAppRole.Factory,
	"aws":        credAws.Factory,
	"azure":      credAzure.Factory,
	"centrify":   credCentrify.Factory,
	"cert":       credCert.Factory,
	"gcp":        credGcp.Factory,
	"github":     credGitHub.Factory,
	"jwt":        credJWT.Factory,
	"kubernetes": credKube.Factory,
	"ldap":       credLdap.Factory,
	"okta":       credOkta.Factory,
	"radius":     credRadius.Factory,
	"userpass":   credUserpass.Factory,
}

var databasePlugins = map[string]BuiltinFactory{
	// These four databasePlugins all use the same mysql implementation but with
	// different username settings passed by the constructor.
	"mysql-database-plugin":        dbMysql.New(dbMysql.MetadataLen, dbMysql.MetadataLen, dbMysql.UsernameLen),
	"mysql-aurora-database-plugin": dbMysql.New(credsutil.NoneLength, dbMysql.LegacyMetadataLen, dbMysql.LegacyUsernameLen),
	"mysql-rds-database-plugin":    dbMysql.New(credsutil.NoneLength, dbMysql.LegacyMetadataLen, dbMysql.LegacyUsernameLen),
	"mysql-legacy-database-plugin": dbMysql.New(credsutil.NoneLength, dbMysql.LegacyMetadataLen, dbMysql.LegacyUsernameLen),

	"postgresql-database-plugin": dbPostgres.New,
	"mssql-database-plugin":      dbMssql.New,
	"cassandra-database-plugin":  dbCass.New,
	"mongodb-database-plugin":    dbMongo.New,
	"hana-database-plugin":       dbHana.New,
}

var logicalBackends = map[string]logical.Factory{
	"ad":         logicalAd.Factory,
	"alicloud":   logicalAlicloud.Factory,
	"aws":        logicalAws.Factory,
	"azure":      logicalAzure.Factory,
	"cassandra":  logicalCass.Factory,
	"consul":     logicalConsul.Factory,
	"database":   logicalDb.Factory,
	"gcp":        logicalGcp.Factory,
	"kv":         logicalKv.Factory,
	"mongodb":    logicalMongo.Factory,
	"mssql":      logicalMssql.Factory,
	"mysql":      logicalMysql.Factory,
	"nomad":      logicalNomad.Factory,
	"pki":        logicalPki.Factory,
	"postgresql": logicalPostgres.Factory,
	"rabbitmq":   logicalRabbit.Factory,
	"ssh":        logicalSsh.Factory,
	"totp":       logicalTotp.Factory,
	"transit":    logicalTransit.Factory,
}
